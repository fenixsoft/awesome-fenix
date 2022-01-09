# 验证

::: tip 验证（Verification）

系统如何确保提交到每项服务中的数据是合乎规则的，不会对系统稳定性、数据一致性、正确性产生风险？

:::

数据验证与程序如何编码是密切相关的，许多开发者都不会把它归入安全的范畴之中。但请细想一下，关注“你是谁”（认证）、“你能做什么”（授权）等问题是很合理的，关注“你做得对不对”（验证）不也同样合理吗？从数量来讲，数据验证不严谨而导致的安全问题比其他安全攻击导致的要多得多；而风险上讲，由数据质量导致的问题，风险有高有低，真遇到高风险的数据问题，面临的损失不一定就比被黑客拖库来得小。

相比其他富有挑战性的安全措施，如防御与攻击两者缠斗的精彩，数学、心理、社会工程和计算机等跨学科知识的结合运用，数据验证确实有些无聊、枯燥，这项常规的工作在日常的开发中贯穿于代码的各个层次，每个程序员都肯定写过。但这种常见的代码反而是迫切需要被架构约束的，缺失的校验影响数据质量，过度的校验不会使得系统更加健壮，某种意义上反而会制造垃圾代码，甚至有副作用。请来看看下面这个实际的段子：

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

最基础的数据问题可以在前端做表单校验来处理，但服务端验证肯定也是要做的，看完了上面的段子后，请想一想，服务端应该在哪一层去做校验？可能会有这样的答案：

- 在 Controller 层做，在 Service 层不做。理由是从 Service 开始会有同级重用，出现 ServiceA.foo(params)调用 ServiceB.bar(params)时，就会对 params 重复校验了两次。
- 在 Service 层做，在 Controller 层不做。理由是无业务含义的格式校验已在前端表单验证处理过，有业务含义的校验，放在 Controller 层无论如何不合适。
- 在 Controller、Service 层各做各的。Controller 做格式校验，Service 层做业务校验，听起来很合理，但这其实就是上面段子中被嘲笑的行为。
- 还有其他一些意见，譬如还有提在持久层做校验，理由是这是最终入口，把守好写入数据库的质量最重要。

上述的讨论大概是不会有统一、正确结论，但是在 Java 里确实是有验证的标准做法，笔者提倡的做法是把校验行为从分层中剥离出来，不是在哪一层做，而是在 Bean 上做。即 Java Bean Validation。从 2009 年的[JSR 303](https://beanvalidation.org/1.0/spec/)的 1.0，到 2013 年的[JSR 349](https://jcp.org/en/jsr/detail?id=349)更新的 1.1，到目前最新的 2017 年发布的[JSR 380](https://beanvalidation.org/2.0/)，定义了 Bean 验证的全套规范。单独将验证提取、封装，可以获得不少好处：

- 对于无业务含义的格式验证，可以做到预置。
- 对于有业务含义的业务验证，可以做到重用，一个 Bean 被用于多个方法用作参数或返回值是很常见的，针对 Bean 做校验比针对方法做校验更有价值。利于集中管理，譬如统一认证的异常体系，统一做国际化、统一给客户端的返回格式等等。
- 避免对输入数据的防御污染到业务代码，如果你的代码里面如果很多下面这样的条件判断，就应该考虑重构了：
  ```java
  // 一些已执行的逻辑
  if (someParam == null) {
  	throw new RuntimeExcetpion("客官不可以！")
  }
  ```
- 利于多个校验器统一执行，统一返回校验结果，避免用户踩地雷、挤牙膏式的试错体验。

据笔者所知，国内的项目使用 Bean Validation 的并不少见，但多数程序员都只使用到它的 Built-In Constraint 来做一些与业务逻辑无关的通用校验，即下面这堆注解，含义基本上看类名就能明白

```java
@Null、@NotNull、@AssertTrue、@AssertFalse、@Min、@Max、@DecimalMin、@DecimalMax、@Negative、@NegativeOrZero、@Positive、@PositiveOrZero、@Size、@Digits、@Past、@PastOrPresent、@Future、@FutureOrPresent、@Pattern、@NotEmpty、@NotBlank、@Email
```

但是与业务相关的校验往往才是最复杂的校验，将简单的校验交给 Bean Validation，而把复杂的校验留给自己，这简直是买椟还珠故事的程序员版本。其实以 Bean Validation 的标准方式来做业务校验是非常优雅的，以 Fenix's Bookstore 的在用户资源上的两个方法为例：

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

- `@UniqueAccount`：传入的用户对象必须是唯一的，不与数据库中任何已有用户的名称、手机、邮箱产生重复。
- `@AuthenticatedAccount`：传入的用户对象必须与当前登录的用户一致。
- `@NotConflictAccount`：传入的用户对象中的信息与其他用户是无冲突的，譬如将一个注册用户的邮箱，修改成与另外一个已存在的注册用户一致的值，这便是冲突。

这里的需求很容易理解，注册新用户时，应约束不与任何已有用户的关键信息重复；而修改自己的信息时，只能与自己的信息重复，而且只能修改当前登录用户的信息。这些约束规则不仅仅为这两个方法服务，它们可能会在用户资源中的其他入口被使用到，乃至在其他分层的代码中被使用到，在 Bean 上做校验就能一揽子地覆盖上述这些使用场景。下面代码是这三个自定义注解对应校验器的实现类：

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

这样业务校验便和业务逻辑就完全分离开来，在需要校验时用`@Valid`注解自动触发，或者通过代码手动触发执行，可根据你们项目的要求，将这些注解应用于控制器、服务层、持久层等任何层次的代码之中。此外，校验结果不满足时的提示信息，也便于统一处理，如提供默认值、提供国际化支持（这里没做）、提供统一的客户端返回格式（创建一个用于`ConstraintViolationException`的异常处理器来实现，代码中有但这里没有贴出来），以及批量执行全部校验，避免出开篇那个段子中挤牙膏的尴尬。

对于 Bean 与 Bean 校验器，笔者另外有两条编码建议。第一条是对校验项预置好默认的提示信息，这样当校验不通过时用户能获得明确的修正提示，以下是代码示例：

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

另外一条建议是将不带业务含义的格式校验注解放到 Bean 的类定义之上，将带业务逻辑的校验放到 Bean 的类定义的外面。这两者的区别是放在类定义中的注解能够自动运行，而放到类外面则需要像前面代码那样，明确标出注解时才会运行。譬如用户账号实体中的部分代码为：

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

这些校验注解都直接放在类定义中，每次执行校验的时候它们都会被运行。由于 Bean Validation 是 Java 的标准规范，它执行的频率可能比编写代码的程序所预想的要更高，譬如使用 Hibernate 来做持久化时，便会自动执行 Data Object 上的校验注解。对于那些不带业务含义的注解，运行是不需要其他外部资源参与的，不会调用远程服务、访问数据库，这种校验重复执行并没有什么成本。

但带业务逻辑的校验，通常就需要外部资源参与执行，这不仅仅是多消耗一点时间和运算资源的问题，由于很难保证依赖的每个服务都是幂等的，重复执行校验很可能会带来额外的副作用。因此应该放到外面让使用者自行判断是否要触发。

还有一些“需要触发一部分校验”的非典型情况，譬如“新增”操作 A 需要执行全部校验规则，“修改”操作 B 中希望不校验某个字段，“删除”操作 C 中希望改变某一条校验规则，这时候要就要启用分组校验来处理，设计一套“新增”、“修改”、“删除”这样的标识类，置入到校验注解的`groups`参数中去实现。
