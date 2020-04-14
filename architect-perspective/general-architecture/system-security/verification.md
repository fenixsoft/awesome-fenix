# 验证

::: tip 验证（Verification）

系统如何确保提交到每项服务中的数据是合乎规则的，不会对系统稳定性、数据一致性、正确性产生风险？

:::

一般认为，数据验证不归属在安全这个话题中，但请相信我，从数量来讲，数据验证不严谨而导致的安全问题比其他安全攻击导致的要多得多；而风险上讲，由数据质量导致的问题，风险有高有低，真遇到高风险的数据问题，导致的损失不一定比被拖库什么来的小。

不过，相比起其他富有挑战性的安全措施，防御与攻击两者缠斗的精彩，数学、心理、社会工程和计算机等跨学科知识的结合运用，数据验证倒确实是不可否认地有些无聊枯燥的，这是一项非常常见的工作，在日常的开发中贯穿于代码的各个层次，每个程序员都肯定写过。以架构者的视角，这种常见的代码反而是迫切需要被架构约束的，缺失的校验影响数据质量，过度的校验不会使得系统更加健壮，某种意义上反而是垃圾代码，甚至有副作用。来看看下面这个段子：

```
前  端： 提交一份用户数据（姓名:某, 性别:男, 爱好:女, 签名:xxx, 手机:xxx, 邮箱:null）
控制器： 发现邮箱是空的，抛ValidationException("邮箱没填")
前  端： 已修改，重新提交
安  全： 发送验证码时发现手机号少一位，抛RemoteInvokeException("无法发送验证码")
前  端： 已修改，重新提交
服务层： 邮箱怎么有重复啊，抛BusinessRuntimeException("不允许开小号")
前  端： 已修改，重新提交
持久层： 签名字段超长了插不进去，抛SQLException("插入数据库失败，SQL：xxx")
…… ……
前  端： 你们这些坑管挖不管埋的后端，各种异常都往前抛！
用  户： 这系统牙膏厂生产的？
```

最基础的数据问题可以在前端做表单校验来处理，但后端验证肯定是要做的，上面的段子看完了想一想，服务端应该在哪一层去做校验？可能会有这样的答案：

- 在Controller层做，在Service层不做。理由是从Service开始会有同级重用，出现ServiceA.foo(params)调用ServiceB.bar(params)时，相当于对params重复校验了两次。
- 在Service层做，在Controller层不做。理由是无业务含义的格式校验已在前端表单验证处理过，有业务含义的校验，放在Controller层无论如何不合适。
- 在Controller、Service层各做各的。Controller做格式校验，Service层做业务校验，就是上面那段子中的行为。
- 还有其他一些意见，譬如还有提在持久层做校验，理由是这是最终入口，把守好写入数据库的质量最重要。

上述的讨论大概是不会有统一的正确结论，但是在Java里确实是有验证的标准做法，提倡的是把校验行为从分层中剥离出来，不是在哪一层做，而是在Bean上做。即Java Bean Validation。从2009年的[JSR 303](https://beanvalidation.org/1.0/spec/)的1.0，到2013年的[JSR 349](https://jcp.org/en/jsr/detail?id=349)更新的1.1，到目前最新的2017年发布的[JSR 380](https://beanvalidation.org/2.0/)，定义了Bean验证的全套规范。单独将验证提取、封装，可以获得不少好处：

- 对于无业务含义的格式验证，可以做到预置。

- 对于有业务含义的业务验证，可以做到重用。一个Bean适用于多个方法是非常常见的。

- 利于集中管理，譬如统一认证的异常体系，统一做国际化、统一给客户端的返回格式等等。

- 避免对输入数据的防御污染到业务代码，如果你的代码里面如果很多下面这样的条件判断，应该考虑重构

  ```java
  // 一些已执行的逻辑
  if (someParam == null) {
  	throw new RuntimeExcetpion("客官不可以！")
  }
  ```

- 利于多个校验器统一执行，统一返回校验结果，避免用户踩地雷、挤牙膏式的试错体验。

其实，据我了解，国内的项目使用Bean Validation的还是不少的，但多数都只使用到它的Built-In Constraint，即下面这堆注解（含义我就不写了，用处基本上看类名就能明白）：

```java
@Null、@NotNull、@AssertTrue、@AssertFalse、@Min、@Max、@DecimalMin、@DecimalMax、@Negative、@NegativeOrZero、@Positive、@PositiveOrZeor、@Szie、@Digits、@Pass、@PassOrPresent、@Future、@FutureOrPresent、@Pattern、@NotEmpty、@NotBlank、@Email
```

一般实现会采用Hibernate Validator，另外一个非主流选择是Apache BVal，它们都扩展了自己的私有注解。其中有一些注解，像@Email、@NotEmpty、@NotBlank，从以前Hibernate Validator私有注解，随着版本升级转正成为标准。

但是其中多数项目对Bean Validation的使用就到此为止了，带业务含义的代码都还是习惯写到方法体内，导致完全没法管理。其实这部分带有复杂逻辑的校验，才是最需要约束的，更加应该借助Bean Validation来完成。以Fenix‘s Bookstore的在用户资源上的两个方法为例：

```java
/**
* 创建新的用户
*/
@POST
public Response createUser(@Valid @UniqueAccount Account user) {
	return CommonResponse.op(() -> service.createAccount(user));
}

/**
* 更新用户信息
*/
@PUT
@CacheEvict(key = "#user.username")
public Response updateUser(@Valid @AuthenticatedAccount @NotConflictAccount Account user) {
	return CommonResponse.op(() -> service.updateAccount(user));
}
```

注意其中的三个自定义校验注解，它们的含义分别是：

- @UniqueAccount：传入的用户对象必须是唯一的，不与数据库中任何已有用户的名称、手机、邮箱产生重复。
- @AuthenticatedAccount：传入的用户对象必须与当前登陆的用户一致。
- @NotConflictAccount：传入的用户对象中的信息与其他用户是无冲突的，譬如将一个注册用户的邮箱，修改成与另外一个已存在的注册用户一致的值，这便是冲突。

这里的需求很容易想明白，注册新用户时，应约束不与任何已有用户的关键信息重复；而修改自己的信息时，只能与自己的信息重复，而且只能修改当前登陆用户的信息。这些约束规则不仅仅为这两个方法服务，它们可能会在用户资源中的其他入口被使用到，甚至在其他分层的代码中被使用到。下面是这三个自定义注解对应校验器的实现类：

```java
public static class AuthenticatedAccountValidator extends AccountValidation<AuthenticatedAccount> {
    public void initialize(AuthenticatedAccount constraintAnnotation) {
        predicate = c -> {
            AuthenticAccount loginUser = (AuthenticAccount) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return c.getId().equals(loginUser.getId());
        };
    }
}

public static class UniqueAccountValidator extends AccountValidation<UniqueAccount> {
    public void initialize(UniqueAccount constraintAnnotation) {
        predicate = c -> !repository.existsByUsernameOrEmailOrTelephone(c.getUsername(), c.getEmail(), c.getTelephone());
    }
}

public static class NotConflictAccountValidator extends AccountValidation<NotConflictAccount> {
    public void initialize(NotConflictAccount constraintAnnotation) {
        predicate = c -> {
            Collection<Account> collection = repository.findByUsernameOrEmailOrTelephone(c.getUsername(), c.getEmail(), c.getTelephone());
            // 将用户名、邮件、电话改成与现有完全不重复的，或者只与自己重复的，就不算冲突
            return collection.isEmpty() || (collection.size() == 1 && collection.iterator().next().getId().equals(c.getId()));
        };
    }
}
```

这样业务校验便和业务逻辑分离开来，在需要使用时用@Valid注解自动或者通过代码手动触发执行，可根据你们公司的要求，使用于控制器、服务层、持久层等任何层次之中。此外，校验结果不满足时的提示信息，也便于统一处理，如提供默认值、提供国际化支持（这里没做）、提供统一的客户端返回格式（创建一个用于ConstraintViolationException的异常处理器），以及批量执行全部校验避免挤牙膏等诸多好处。下面是预置默认提示信息的例子：

```java
/**
 * 表示一个用户的信息是无冲突的
 * 
 * “无冲突”是指该用户的敏感信息与其他用户不重合，譬如将一个注册用户的邮箱，修改成与另外一个已存在的注册用户一致的值，这便是冲突
 **/
@Documented
@Retention(RUNTIME)
@Target({FIELD, METHOD, PARAMETER, TYPE})
@Constraint(validatedBy = AccountValidation.NotConflictAccountValidator.class)
public @interface NotConflictAccount {
    String message() default "用户名称、邮箱、手机号码与现存用户产生重复";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

```

另外一条建议是将不带业务含义的格式校验注解放到类上，将带业务含义的注解放到外面。譬如用户账号实体中的部分代码为：

```java
public class Account extends BaseEntity {
	@NotEmpty(message = "用户不允许为空")
    private String username;

    @NotEmpty(message = "用户姓名不允许为空")
    private String name;

    private String avatar;

    @Pattern(regexp = "1\\d{10}", message = "手机号格式不正确")
    private String telephone;

    @Email(message = "邮箱格式不正确")
    private String email;
}
```

把校验注解放在类定义中，意味着所有执行校验的时候它们都会被运行（譬如Insert、Update的时候，Hibernate都会自动执行DO上的校验注解）。而不带业务含义的注解运行是不需要其他外部资源（譬如数据库）参与的，这种重复执行通常并无坏处（系统的压力往往不在CPU，闲着也是闲着）。

如果真的遇到一些非典型情况，譬如“新增”操作需要执行全部校验规则，“修改”操作中希望不校验某个字段，“删除”操作C中希望改变某一条校验规则，这时候要就要启用分组校验来处理，设计一套“新增”、“修改”、“删除”这样的标识类，置入到校验注解的groups参数中。