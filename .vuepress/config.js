module.exports = {
    title: '软件架构探索：The Fenix Project',
    description: '现代软件架构探索',
    head: [
        ['link', {rel: 'shortcut icon', type: "image/x-icon", href: `./favicon.ico`}]
    ],
    host: '0.0.0.0',
    port: 8080,
    dest: '.vuepress/dist',
    themeConfig: {
        lastUpdated: '最后更新',
        smoothScroll: true,
        repo: 'fenixsoft/awesome-fenix',
        editLinks: true,
        editLinkText: '在GitHub中编辑',
        // 添加导航栏
        nav: [
            {text: '首页', link: '/'}, {
                text: '代码',
                // 这里是下拉列表展现形式。
                items: [
                    {
                        text: '前端工程',
                        link: 'https://github.com/fenixsoft/fenix-bookstore-frontend'
                    },
                    {
                        text: '后端：单体架构 SpringBoot',
                        link: 'https://github.com/fenixsoft/monolithic_arch_springboot'
                    },
                    {
                        text: '后端：微服务架构 SpringCloud',
                        link: 'https://github.com/fenixsoft/microservice_arch_springcloud'
                    },
                    {
                        text: '后端：微服务架构 Kubernetes',
                        link: 'https://github.com/fenixsoft/microservice_arch_kubernetes'
                    },
                    {
                        text: '后端：无服务架构 Knative',
                        link: 'https://github.com/fenixsoft/serverless_arch_knative'
                    }
                ]
            },
            {text: '示例', link: 'http://bookstore.icyfenix.cn'},
            {text: '讨论区', link: '/board', target: "_self"}
        ],
        sidebar: [
            {
                title: '前言',
                collapsable: false,
                children: ['/introduction/about-me', '/introduction/about-the-fenix-project']
            }, {
                title: '迈向微服务',
                collapsable: false,
                children: [
                    '/deployment/development-env-setup/', {
                        title: '环境依赖',
                        collapsable: false,
                        children: ['/deployment/deployment-env-setup/setup-docker', {
                            title: '部署Kubernetes集群',
                            path: '/deployment/deployment-env-setup/setup-kubernetes',
                            collapsable: false,
                            children: ['/deployment/deployment-env-setup/setup-kubernetes/setup-kubeadm', '/deployment/deployment-env-setup/setup-kubernetes/setup-rancher', '/deployment/deployment-env-setup/setup-kubernetes/setup-minikube']
                        }]
                    }, {
                        title: '运维环境',
                        path: '/deployment/operation-env-setup',
                        collapsable: false,
                        children: ['/deployment/operation-env-setup/elk-setup', '/deployment/operation-env-setup/devops-setup']
                    }]
            }, {
                title: '架构的视角',
                collapsable: false,
                children: [
                    {
                        title: '单体架构',
                        collapsable: false,
                        children: ['/architect-perspective/monolithic-architecture/system-security.md', '/architect-perspective/monolithic-architecture/transaction', '/architect-perspective/monolithic-architecture/constraint']
                    }, {
                        title: '微服务架构',
                        collapsable: false,
                        children: ['/architect-perspective/microservices-architecture/system-security']
                    }]
            }, {
                title: '演进中的架构',
                collapsable: false,
                children: ['/architecture/architect-history', {
                    title: '单体架构',
                    path: '/architecture/monolithic-architecture',
                    collapsable: false,
                    children: ['/architecture/monolithic-architecture/j2ee-base-arch', '/architecture/monolithic-architecture/springboot-base-arch']
                }, {
                    title: '微服务架构',
                    path: '/architecture/microservices-architecture',
                    collapsable: false,
                    children: ['/architecture/microservices-architecture/springcloud-base-arch', '/architecture/microservices-architecture/kubernetes-base-arch', '/architecture/microservices-architecture/servicemesh-lstio-arch']
                }, {
                    title: '无服务架构',
                    path: '/architecture/serverless-architecture',
                    collapsable: false,
                    children: ['/architecture/serverless-architecture/serverless-arch-knative', '/architecture/serverless-architecture/serverless-arch-kubeless']
                }]
            }, {
                title: '核心技术支撑点',
                collapsable: false,
                children: ['/technology/service-discovery', '/technology/load-balancing', {
                    title: '链路治理',
                    path: '/technology/invokechain-manage',
                    collapsable: false,
                    children: ['/technology/invokechain-manage/traffic-control', '/technology/invokechain-manage/service-downgrade', '/technology/invokechain-manage/exception-inject', '/technology/invokechain-manage/invokechain-trace']
                }, '/technology/logging', '/technology/configuration', '/technology/message-queue-bus']
            }, {
                title: '不可变基础设施',
                collapsable: false,
                children: [{
                    title: '网络',
                    path: '/immutable-infrastructure/network',
                    collapsable: false,
                    children: ['/immutable-infrastructure/network/kubernetes-cni', '/immutable-infrastructure/network/kubernetes-lb']
                }, '/immutable-infrastructure/storage', '/immutable-infrastructure/gpu-support', '/immutable-infrastructure/hardware-schedule']
            }, {
                title: '独立专题',
                path: '/monographic',
                collapsable: false,
                children: ['/monographic/distributed-transaction', '/monographic/graalvm-improvement']
            }, {
                title: '产品发布准备',
                path: '/release',
                collapsable: false,
                children: ['/release/build-script', '/release/continuous-integration', '/release/gated-launch']
            }
        ]
    }
}
