# 在容器中编译OpenJDK



## 编译环境



## 按需编译





## 裁剪





## Alpine Musl

```
sh ./configure --with-jvm-variants=server \
--with-boot-jdk=$BOOT_JDK \
--with-build-jdk=$BUILD_JDK \
--openjdk-target=x86_64-unknown-linux-musl \
--with-devkit=$DEVKIT \
--with-sysroot=$SYSROOT
```