# 部署 Istio

在 Istio 官方文档上提供了[通过 Istioctl 安装](https://istio.io/latest/zh/docs/setup/install/istioctl/)、[通过 Helm 安装](https://istio.io/latest/zh/docs/setup/install/helm/)和[通过 Operator 安装](https://istio.io/latest/zh/docs/setup/install/standalone-operator/)三种方式，其中，基于 Helm 方式在 Istio 1.5 版之后已被废弃，Operator 方式目前仍处于实验阶段，本文选择采用 Istioctl 方式进行安装。

## 获取 Istio

首先访问[Istio release](https://github.com/istio/istio/releases/tag/1.7.3)页面下载与你操作系统匹配的安装文件。在 macOS 或 Linux 系统中，也可以通过以下命令直接下载最新版本的 Istio：

```bash
$ curl -L https://istio.io/downloadIstio | sh -
```

解压后，安装目录包括以下内容：

| 目录      | 包含内容                                                   |
| --------- | ---------------------------------------------------------- |
| `bin`     | 包含 istioctl 的客户端文件                                 |
| `install` | 包含 Consul、GCP 和 Kubernetes 平台的 Istio 安装脚本和文件 |
| `samples` | 包含示例应用程序                                           |
| `tools`   | 包含用于性能测试和在本地机器上进行测试的脚本               |

将`bin`目录下的`istioctl`客户端路径增加到`path`环境变量中，macOS 或 Linux 系统的增加方式如下：

```bash
$ export PATH=$PWD/bin:$PATH
```

如果你在使用 bash 或 ZSH 的话，可以选择启动[Auto Completion Option](https://istio.io/latest/zh/docs/ops/diagnostic-tools/istioctl#enabling-auto-completion)。

## 默认安装 Istio

部署 Istio，最简单的方式是安装 `default` 配置文件，直接使用以下命令即可：

```bash
$ istioctl manifest install
```

此命令将在你的 Kubernetes 集群上安装`default`配置文件。`default`配置文件建立生产环境的良好起点，这与旨在评估广泛的 Istio 功能特性的较大的`demo`配置文件不同。各种不同配置文件之间的差异如下表所示：

|                          | default | demo | minimal | sds |
| ------------------------ | ------- | ---- | ------- | --- |
| 核心组件                 |         |      |         |     |
| `istio-citadel`          | X       | X    |         | X   |
| `istio-egressgateway`    |         | X    |         |     |
| `istio-galley`           | X       | X    |         | X   |
| `istio-ingressgateway`   | X       | X    |         | X   |
| `istio-nodeagent`        |         |      |         | X   |
| `istio-pilot`            | X       | X    | X       | X   |
| `istio-policy`           | X       | X    |         | X   |
| `istio-sidecar-injector` | X       | X    |         | X   |
| `istio-telemetry`        | X       | X    |         | X   |
| 插件                     |         |      |         |     |
| `grafana`                |         | X    |         |     |
| `istio-tracing`          |         | X    |         |     |
| `kiali`                  |         | X    |         |     |
| `prometheus`             | X       | X    |         | X   |

安装`default`配置文件后，如果需要其他组件或者插件，可以进行独立安装。譬如要在`default`配置文件之上启用 Grafana Dashboard，用下面的命令设置`addonComponents.grafana.enabled`参数即可：

```bash
$ istioctl manifest install --set addonComponents.grafana.enabled=true
```

## 安装 demo 配置

`demo`这个词语可能会让使用者产生误解，其实 Istio 的`demo`配置是默认安装所有组件的全功能配置，从上面表格中配置与组件的对应情况中可以印证这一点。你可以使用以下`istioctl`命令来列出 Istio 配置文件名称：

```bash
$ istioctl profile list
Istio configuration profiles:
    remote
    separate
    default
    demo
    empty
    minimal
```

通过在命令行上设置配置文件名称安装其他 Istio 配置文件到群集中，使用以下命令安装`demo`配置文件：

```bash
$ istioctl manifest install --set profile=demo
```

## 验证安装成功

你可以使用`verify-install`命令检查 Istio 安装是否成功，它将集群上的安装与你指定的清单进行比较。

如果未在部署之前生成清单，请运行以下命令以现在生成它：

```bash
$ istioctl manifest generate <your original installation options> > $HOME/generated-manifest.yaml
```

然后运行以下`verify-install`命令以查看安装是否成功：

```bash
$ istioctl verify-install -f $HOME/generated-manifest.yaml
```

## 卸载 Istio

可以使用以下命令来卸载 Istio：

```bash
$ istioctl manifest generate <your original installation options> | kubectl delete -f -
```
