# 运行、编译与调试环境

## 运行

由于K3S是单文件发行的，直接在发布页（https://github.com/k3s-io/k3s/releases）中下载，放到PATH路径上即可运行。

源码也可以从发布页中下载source.zip，以保证相同版本，也可以直接在GitHub仓库中拉取（https://github.com/k3s-io/k3s/）

## 编译

K3S是依靠Rancher自家的Dapper来编译，Dapper的作用是在Docker镜像中完成程序构建，以保证在不同机器上都能得到一个稳定的编译环境，屏蔽机器环境对编译的影响，也减轻了准备编译环境的工作负担。

我们重新编译K3S是为了得到一个禁用优化、带有调试符号信息的版本，以便下一步调试运行使用。根据国内的实际情况，有以下几个可选项建议改动：

1. K3S是直接使用golang-alpine的基础镜像的，然后再使用Docker-in-Docker来运行CI环境，由于Dapper文件经常要被反复运行，所以建议自己构建一个基础镜像，代替golang-alpine，节省每次运行时apk安装环境的时间。

    ```
    FROM golang:1.15.5-alpine3.12

    RUN apk -U --no-cache add bash git gcc musl-dev docker vim less file curl wget ca-certificates jq linux-headers zlib-dev tar zip squashfs-tools npm coreutils \
        python2 openssl-dev libffi-dev libseccomp libseccomp-dev make libuv-static sqlite-dev sqlite-static libselinux libselinux-dev zlib-dev zlib-static
    ```

2. 编译文件中写死了给链接器参数加`-w -s`参数删除调试的符号表信息，这个是Kubernetes原版就有的传统了。手动在编译文件中删除掉，并加入编译器参数，禁用优化和方法内联：

    ```
    # 编译器参数：-N是禁用优化，-l是禁止方法内联
    gcflags="all=-N -l"

    # 链接器参数：将原来的-w -s删除掉
    # 注意链接器参数除了在scrips/build文件外，在打all-in-one package的script/build中也存在
    ldflags=""
    ```

3. 编译的最后一步是调用binary_size_check.sh，检查编译结果的大小，1.20版的最大容量为61 MB，但加入调试的符号信息之后，会膨胀至83 MB左右，所以这里要改一下以下常量：

    ```
    #原本是MAX_BINARY_SIZE=61000000，这里改到了100 MB
    MAX_BINARY_SIZE=100000000
    ```

4. 由于我们修改过编译文件，所以要将文件校验开关给关闭掉，在Dapper文件中加入环境变量：

    ```
    ENV SKIP_VALIDATE=true
    ```


5. 最后，如果访问外网有困难，请在Dapper中加上代理：

   ```
   ARG http_proxy=socks5://192.168.31.125:2012
   ARG https_proxy=socks5://192.168.31.125:2012
   ```

然后直接make一下，就可以在dist/artifacts目录中找到k3s了

```
make
```

## 调试