# √ 事务处理 <Badge text="编写中" type="warning"/>

事务处理几乎是每一个信息系统中都会涉及到的问题，它存在的意义就是为了保证系统中数据是正确的，不同数据间不会产生矛盾（一致性，Consistency）。理论上，达成这个目标需要三方面共同努力来保障：在同一项业务处理过程中，事务保证了多个对数据的修改，要么同时成功，要么一起被撤销（原子性，Atomic）；在不同的业务处理过程中，事务保证了各自业务正在读、写的数据互相独立，不会彼此影响（隔离性，Isolation）；最后，事务应当保证所有成功被提交的数据修改都能够正确地被持久化，不丢失数据（持久性，Durability）。以上即事务的“ACID”的概念提法，我个人对这个“ACID”的提法是不太认同的，上述四种特性并不正交，A、I、D是手段，C是目的，完全是为了拼凑个缩写才弄到一块去，误导的弊端大于传播的好处。

事务的概念最初是源于数据库，但今天的信息系统中已经不在局限于数据库本身，所有需要保证数据正确性（一致性）的场景中，包括但不限于数据库、缓存、[事务内存](https://zh.wikipedia.org/wiki/%E4%BA%8B%E5%8A%A1%E5%86%85%E5%AD%98)、消息、队列、对象文件存储，等等，都有可能会涉及到事务处理。当一个服务只操作一个数据源时，通过A、I、D来获得一致性是相对容易的，但当一个服务涉及到多个不同的数据源，甚至多个不同服务同时涉及到多个不同的数据源时，这件事情就变得很困难，有时需要付出很大乃至于是不切实际的代价，因此业界探索过许多其他方案，在确保可操作的前提下获得尽可能高的一致性保障，事务处理由此才从一个具体操作上的“编程问题”上升成一个需要仔细权衡的“架构问题”。

人们在探索这些事务方案的过程中，产生了许多新的思路和概念，有一些概念看上去并不那么直观，在本章里，笔者会通过同一个具体事例在不同的事务方案中如何处理来贯穿、理顺这些概念。

:::quote 场景事例
Fenix's Bookstore是一个在线书店。当一份商品成功售出时，需要确保以下三件事情被正确地处理：

 - 用户的账号扣减相应的商品款项
 - 商品仓库中扣减库存，将商品标识为待配送状态
 - 商家的账号增加相应的商品款项

:::

## 本地事务

本地事务（Local Transactions，其实应该翻译成局部事务才好与稍后的全局事务相对应，但现在几乎所有人都这么叫了）即独立的、不需要“事务管理器（稍后解释这是啥）”进行协调的事务，这是最基础的一种事务处理方案，只能适用于单个服务使用单个数据源的场景。本地事务其实是直接依赖于数据源（通常是DBMS，下面均以JDBC为例）本身的事务能力来实现的，在服务层面，最多只能说是对事务接口做了一层薄包装而已，它对真正的事务的运作并不能产生多少影响。

为了解释“薄包装”和后续讨论方便，我们将事例场景进一步具体化：假设书店的用户、商家、仓库所涉及的数据表都存储于同一个数据库，它们的服务运行于同一个JVM实例之上，使用Spring来进行程序组织，所有服务的[事务传播](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Propagation.html)都是默认的“需要事务”。按照现在主流的开发习惯，其代码大致应如下所示：

```java
@Transactional
public void buyBook(PaymentBill bill) {
    userAccountService.pay(bill.getMoney());
    warehouseService.deliver(bill.getItems());
    businessAccountService.receipt(bill.getMoney());
}
```

我们将声明式事务手工还原回编程式事务：

```java
public void buyBook(PaymentBill bill) {
	transaction.begin();
	try {
    	userAccountService.pay(bill.getMoney());
	    warehouseService.deliver(bill.getItems());
    	businessAccountService.receipt(bill.getMoney());
	    transaction.commit();
	} catch(Exception e) {
    	transaction.rollback();
	}
}
```

代码的语义非常直白，但却不一定如字面所示那般严谨，看起来如果操作不出错，肯定会在commit()中提交事务，如果出错了，肯定回在rollback()中回滚事务。但并非绝对如此，譬如其中数据表采用引擎的是MyISAM，那即使调用了rollback()方法也无法回滚数据，原子性就无法得到保障。同理，对于隔离性，尽管Spring可以将用户所期望的隔离级别传递给数据库，但是具体数据库会不会按照所设置的参数调整隔离级别，如何进行事务隔离，Spring也是完全无法知晓且无法改变的。因此，本地事务具体能够提供怎样的能力，其实取决于底层的数据库本身。

## 全局事务

与本地事务相对的是全局事务（Global Transactions），有一些资料中也将其称为外部事务（External Transactions），在本文中，全局事务是一种适用于单个服务使用多个数据源场景的事务解决方案。请注意，理论上全局事务并没有“单个服务”的约束，它本来就是DTP（[Distributed Transaction Processing](https://en.wikipedia.org/wiki/Distributed_transaction)）模型中的概念，但本节所提到的内容——即仍追求ACID的事务处理方式，实际上几乎只应用在单服务多数据源的场合中，为了避免与后续介绍的放弃ACID事务处理方式相互混淆，这里的全局事务所指范围是有所缩减的，后续涉及多服务的事务，笔者将称其为“分布式事务”。

1991年，为了解决分布式事务的ACID问题，[X/Open](X/Open)组织（后来并入了[TOG](https://en.wikipedia.org/wiki/The_Open_Group)）提出了一套名为[X/Open XA](https://en.wikipedia.org/wiki/X/Open_XA)（XA是eXtended Architecture的缩写）的处理事务架构，其主要内容是定义了全局的事务管理器（Transaction Manager，用于协调全局事务）和局部的资源管理器（Resource Manager，用于驱动本地事务）之间的通讯接口。XA接口是双向的，能在一个事务管理器和多个资源管理器（Resource Manager）之间形成通信桥梁，通过两段式提交实现多个事务的统一提交或者统一回滚，现在我们在Java代码中还偶尔能看见的XADataSource、XAResource这些名字就源于此。

不过，XA并不是Java规范（那时候还没有Java），而是一套通用技术规范，所以Java中专门定义了[JSR 907 Java Transaction API](https://www.jcp.org/en/jsr/detail?id=907)来作为XA在Java语言中的实现，这也就是我们现在所熟知的JTA。JTA最主要的两个接口是：

- 事务管理器的接口：javax.transaction.TransactionManager。这套接口是给Java EE服务器提供容器事务（由容器自动负责事务管理）使用的，还提供了另外一套javax.transaction.UserTransaction接口，用于通过程序代码手动开启、提交和回滚事务。
- 满足XA规范的资源定义接口：javax.transaction.xa.XAResource，任何资源（JDBC、JMS等等）如果需要支持JTA，只要实现XAResource接口中的方法即可。

原本JTA是Java EE中的技术，一般情况下应该由JBoss、WebSphere、WebLogic这些Java EE容器来提供，但现在[Bittronix](https://web.archive.org/web/20100414140721/http://docs.codehaus.org/display/BTM/Home)、[Atomikos](http://www.atomikos.com/Main/TransactionsEssentials)和[JBossTM](http://www.jboss.org/jbosstm)（以前叫Arjuna）都以JAR包的形式实现了JTA的接口，使得我们能够在Tomcat、Jetty这样的Java SE环境下也能使用JTA。

现在，我们对示例场景做另外一种假设：如果书店的用户、商家、仓库分别处于不同的数据库中，其他条件仍与之前相同，那情况会发生什么变化？以声明式事务来编码的话，代码可以一个字都不改变，但仍手工还原回编程式事务的话，其语义如下所示：

```java
public void buyBook(PaymentBill bill) {
	userTransaction.begin();
    warehouseTransaction.begin();
    businessTransaction.begin();
	try {
    	userAccountService.pay(bill.getMoney());
	    warehouseService.deliver(bill.getItems());
    	businessAccountService.receipt(bill.getMoney());
        userTransaction.commit();
    	warehouseTransaction.commit();
	    businessTransaction.commit();
	} catch(Exception e) {
        userTransaction.rollback();
    	warehouseTransaction.rollback();
	    businessTransaction.rollback();
	}
}
```

但实际上代码是并不能这样写的，试想一下，如果在businessTransaction.commit()中出现错误，代码转到catch块中执行，此时userTransaction和warehouseTransaction已经完成提交，再调用rollback()方法也无济于事，整个事务的一致性也就无法保证了。为了解决这个问题，XA将事务提交拆分成为两阶段过程：

- 准备阶段（又叫做投票阶段）：在这一阶段，事务管理器询问所有参与的资源管理器是否准备好提交，参与者如果已经准备好提交则回复Prepared，否则回复Non-Prepared。所谓的准备，对于数据库来说，其逻辑几乎就相当于原本的commit()操作，区别是在提交数据做完持久化后不释放隔离性，即仍继续维持数据对其他事务的隔离状态，并在数据库日志中明确记录本次提交的所有数据。
- 提交阶段（又叫做执行阶段）：协调者如果在上一阶段收到所有参与者回复的Prepared，则在此阶段向所有参与者发送commit指令，所有参与者立即执行commit操作；否则事务管理器向所有参与者发送rollback指令，参与者立即执行rollback操作。对于数据库来说，执行阶段收到的commit通知其实是“不回滚”的通知，这个操作只是释放隔离性，应是很轻量的操作，只有收到rollback操作时，才需要清理已提交的数据，这是个重负载操作。

这两个过程被称为“[两段式提交](https://zh.wikipedia.org/wiki/%E4%BA%8C%E9%98%B6%E6%AE%B5%E6%8F%90%E4%BA%A4)”（2 Phase Commit，2PC），它能够成立还要求有其他前提条件：

- 假设网络是可靠的，XA的设计目标并不是解决诸如[拜占庭问题](https://zh.wikipedia.org/wiki/%E6%8B%9C%E5%8D%A0%E5%BA%AD%E5%B0%86%E5%86%9B%E9%97%AE%E9%A2%98)的网络问题。两段式提交中投票阶段失败了可以回滚，而提交阶段时间是很短的，这也是为了尽量控制网络风险的考虑。
- 假设因为网络、机器崩溃或者其他原因而导致失联的节点最终能够恢复，不会永久性地处于崩溃状态。由于在准备阶段已经写入了完整的日志，所以当失联机器一旦恢复，就能够从日志中找出已准备妥当但并未提交的数据，从而向事务管理器查询到下一步应该进行的操作。

再次提醒一下，这里所说的全局事务是特指向单服务多数据源的场景，所以笔者并没有写XA协议中选举协调者的内容。两段式提交的交互时序如下图所示：
<mermaid>
sequenceDiagram
	事务管理器 ->>+ 资源管理器: Request to Prepare
	资源管理器 -->>- 事务管理器: Prepared
	事务管理器 ->>+ 资源管理器: Request to Commit
	资源管理器 -->>- 事务管理器: Committed
    opt Exception
        事务管理器 ->>+ 资源管理器: Request to Rollback
        资源管理器 -->>- 事务管理器: Rollbacked
    end
</mermaid>


## 分布式事务