# 单体架构

需要考虑的问题：

功能性需求、非功能性需求（质量：防止被外部搞崩，譬如流量、譬如安全攻击。约束：不会被内部搞崩，譬如低水平程序员，BUG控制）



领域拆分：

​	功能性原则：DDD

​	非功能性原则：流量规划、约束



非功能性层面：

质量属性：

安全

​	跨站攻击XSS  域安全与CRSF 链路安全

认证（Authentication）

​	Spring-Security

授权（authorization）

​	OAUTH2协议、Spring-Security-Oauth2

校验

​	javax.validation API

事务

​	Spring声明式事务



约束属性：

分层约束：

​	页面控制	服务端/客户端控制器（VUE前端路由）

​	服务：Jersey

​	数据访问  SpringData JPA 

​	模型

整体约束：

​	可测试性

​	架构约束能力





