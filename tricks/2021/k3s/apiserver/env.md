# K3S启动APIServer/Agent的环境准备

1. 入口：`cmd/server/main.go::main()`

   1. 注册了containerd\kubectl\crictl\ctr四个reexec启动函数，对应了四个同名的以及agent启动子命令。
   2. 由于传入参数是server，由urfave cli执行server::Run函数。

2. 处理命令行参数：`pkg/cli/server/server.go::Run()`

   1. 重设进程的命令行参数，以避免参数中存在敏感信息泄漏的风险（譬如被ps命令列出）

      ```go
      // hide process arguments from ps output, since they may contain
      // database credentials or other secrets.
      gspt.SetProcTitle(os.Args[0] + " server")
      ```

   2. 命令行中传入的参数，会在urfave cli支持下，写入到全局变量ServerConfig中（NewServerCommand方法），在`Run()`方法中，将名为`ServerConfig`的`Server struct`转换为带层次结构的`server.Config struct`。命令行中可接受的参数如下：

      ```
      	ClusterCIDR    string
      	AgentToken     string
      	AgentTokenFile string
      	Token          string
      	TokenFile      string
      	ClusterSecret  string
      	ServiceCIDR    string
      	ClusterDNS     string
      	ClusterDomain  string
      	// The port which kubectl clients can access k8s
      	HTTPSPort int
      	// The port which custom k3s API runs on
      	SupervisorPort int
      	// The port which kube-apiserver runs on
      	APIServerPort            int
      	APIServerBindAddress     string
      	DataDir                  string
      	DisableAgent             bool
      	KubeConfigOutput         string
      	KubeConfigMode           string
      	TLSSan                   cli.StringSlice
      	BindAddress              string
      	ExtraAPIArgs             cli.StringSlice
      	ExtraSchedulerArgs       cli.StringSlice
      	ExtraControllerArgs      cli.StringSlice
      	ExtraCloudControllerArgs cli.StringSlice
      	Rootless                 bool
      	DatastoreEndpoint        string
      	DatastoreCAFile          string
      	DatastoreCertFile        string
      	DatastoreKeyFile         string
      	AdvertiseIP              string
      	AdvertisePort            int
      	DisableScheduler         bool
      	ServerURL                string
      	FlannelBackend           string
      	DefaultLocalStoragePath  string
      	DisableCCM               bool
      	DisableNPC               bool
      	DisableKubeProxy         bool
      	ClusterInit              bool
      	ClusterReset             bool
      	ClusterResetRestorePath  string
      	EncryptSecrets           bool
      	StartupHooks             []func(context.Context, <-chan struct{}, string) error
      	EtcdDisableSnapshots     bool
      	EtcdSnapshotDir          string
      	EtcdSnapshotCron         string
      	EtcdSnapshotRetention    int
      ```

   3. 命令行参数（也包含一些Agent Node等默认参数）初始化结束后，以`server.Config`结构传递给`pkg/server/server.go::StartServer()`方法。

   4. 建立一条goroutine，等待`serverConfig.ControlConfig.Runtime.APIServerReady`通道的信号。

   5. 启动Agent，转入`pkg/agent/run.go::Run()`，详见“[K3S启动Agent的环境准备]()”

3. 启动服务器的环境准备：`pkg/server/server.go::StartServer()`，这里要包括 Etcd（或基于Kine包装的代替品）、APIServer等一系列服务。

   1. 建立临时目录，以及设定对K3S管理的地址加入NOPROXY环境变量，避免受外部代理的干扰

      ```go
      setupDataDirAndChdir(&config.ControlConfig);
      setNoProxyEnv(&config.ControlConfig);
      ```

   2. 调用`pkg/daemons/control/server.go::Server()`，启动APIServer服务器：

      1. 设置默认值，在`defaults()`方法中初始化[CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)范围、APIServer默认端口（`6443`/`6444`）、默认的数据目录（`/var/lib/rancher/k3s/server`）的默认值。

      2. 在`prepare()`方法开始准备服务器环境，包括：

         1. 设置默认证书，初始化Client（Admin、Controller、CloudController、Scheduler、KubeAPI、KuberPorxy、K3SController、Etcd）、Server、RequestHeader等的CA、Key文件路径（只是路径，不包括内容）。

         2. 调用`cluster.Bootstrap()`方法（`pkg/cluster/bootstrap.go`），初始化集群后端存储。Rancher提供的cluster包解耦了Kubernetes对Etcd的直接依赖，使得K3S既可以使用内嵌的托管数据库模式，也可以使用SQLite、MySQL、PGSQL等非托管数据库模式。

            > **managed database** is one whose lifecycle we control - initializing the cluster, adding/removing members, taking snapshots, etc

         3. 初始化证书、ServiceAccount、Users（即Server和Node的Password）、EncryptedNetworkInfo（即IPSEC Key）、EncryptionConfig、Tokens信息

            ```go
            if err := genCerts(config, runtime); err != nil {
            	return err
            }

            if err := genServiceAccount(runtime); err != nil {
            	return err
            }

            if err := genUsers(config, runtime); err != nil {
            	return err
            }

            if err := genEncryptedNetworkInfo(config, runtime); err != nil {
            	return err
            }

            if err := genEncryptionConfig(config, runtime); err != nil {
            	return err
            }

            if err := readTokens(runtime); err != nil {
            	return err
            }
            ```

         4. 调用`cluster.Start()`方法，启动集群后端存储。对于托管数据库，会在此时进行启动和测试工作，而非托管数据库，则只会在`startStorage()`方法中启动[Kine](https://github.com/k3s-io/kine)的监听器，开放一个默认名为`unix://kine.sock`的UDS地址。

      3. 通过`setupTunnel()`方法，调用Rancher的[Remote Dialer](https://github.com/rancher/remotedialer)创建了一条通信隧道，并将它赋值给`k8s.io/kubernetes/cmd/kube-apiserver/app.DefaultProxyDialerFn`，因此后续K8S将能够使用到它来进行通信。

      4. 通过`apiServer()`方法，将`config.Control`中的一批参数，又重新转换成kube-apiserver的命令行参数。这里调用了`executor.APIServer`，真正从K3S的包装代码过度到K8S里。调用的方式不是fork子进程，而是通过启动一条新的goroutine，直接在进程内调用[Cobra](https://github.com/spf13/cobra)（Kubernetes所采用的命令行框架）中的Command，具体Command的启动函数位于`k8s.io/kubernetes/cmd/kube-apiserver/app/server.go::Run()`方法。这部分的具体分析见：[K8S-APIServer启动过程](bootstrap.md)。

   3. 在`router()`方法中，将`prepare()`方法里生成的一系列证书、serverConfig的配置信息、数据库信息、静态资源、ping地址等设置好HTTP Endpoint，并以[Gorilla Mux Router](https://github.com/gorilla/mux)的形式返回。这一步相当于建立了一个内置的HTTP服务器。

   4. 等待`config.ControlConfig.Runtime.APIServerReady`信号，收到后启动`runControllers()`方法。

   5. 打印Agent加入Server的命令地址，如：

      ```
      Node token is available at /var/lib/rancher/k3s/server/token
      To join node to cluster: k3s agent -s https://172.19.45.5:6443 -t ${NODE_TOKEN}
      ```

   6. 将ServerCA、ClientAdminCert、ClientAdminKey以YAML格式写入磁盘，默认位置是`/etc/rancher/k3s/k3s.yaml`。

4. 与构建serverConfig类似，构建agentConfig对象，调用`pkg/agent/run.go::Run()`方法，创建Node Agent：

   1. 在`syssetup.Configure()`方法中对系统运行Agent的条件进行检查，确认Linux Kernel的驱动模块（在`/sys/module/`下存在）和Kernel的内核信息映射 （在`/proc/sys/`下可读写）。
   2. 在`pkg/agent/proxy/apiproxy.go::NewAPIProxy()`方法创建proxy对象（仅仅是初始化了对象），在`clientaccess.ParseAndValidateTokenForUser()`创建客户端访问令牌。
   3. 转入`run()`方法，开始Node Agent运行
      1. `setupCriCtlConfig()`及`containerd.Run()`：建立CRI配置信息，K3S默认的CRI是containerd，可以在配置中要求使用DockerShim。后续会以默认为`unix:///run/k3s/containerd/containerd.sock`的UDS地址与CRI框架通讯，这个地址会写入到`/var/lib/rancher/k3s/agent/etc/crictl.yaml`中，配置会写入`/var/lib/rancher/k3s/agent/etc/containerd/config.toml`，然后以exec.Command的形式fork一个containerd的子进程，如果数据目录里面的`/images`目录存在（默认不存在），还会自动预载里面的镜像到CRI框架中。
      2. `flannel.Prepare()`建立CNI网络信息，K3S默认的CNI插件是Flannel VXLAN，可以在配置中设置NoFlanel然后自己安装网络插件。默认网络信息会写到`/var/lib/rancher/k3s/agent/etc/cni/net.d/10-flannel.conflist`和`/var/lib/rancher/k3s/agent/etc/flannel/net-conf.json`
      3. `tunnel.Setup()`Agent获得与Kube-APIServer的通讯Endpoint、证书，并建立连接。证书等信息是默认从`/var/lib/rancher/k3s/agent/k3scontroller.kubeconfig`文件中读取得到的，然后访问`GET https://master-ip:6443/api/v1/namespaces/default/endpoints/kubernetes`，确认通信是否成功（只要通信成功，不在乎返回值是403），成功后通过`proxy.Update()`更新至Remotedialer Proxy对象。同时也会生成WebSockets连接：`wss://master-ip:6443/v1-k3s/connect`。
      4. `agent.Agent()`调用Kubelet进程，从环境上下文中收集参数，转换形成kubelet命令行参数格式，然后同样是在进程内调用Cobra的Command，这部分内容在：“[Kubelet启动过程](../kubelet/bootstrap.md)”中分析。
      5. `configureNode()`

5. 等待ctx.Done()，持续运行。

