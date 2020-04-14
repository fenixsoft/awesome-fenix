module.exports = {
    title: '软件架构探索：The Fenix Project',
    description: '现代软件架构探索',
    head: [
        ['link', {rel: 'shortcut icon', type: "image/x-icon", href: `/favicon.ico`}]
    ],
    host: 'localhost',
    port: 8080,
    dest: '.vuepress/dist',
    plugins: [
        ['vuepress-plugin-container',
            {
                type: 'right',
                defaultTitle: ''
            }
        ],
        ['vuepress-plugin-container',
            {
                type: 'center',
                defaultTitle: ''
            }
        ],
        ['vuepress-plugin-container',
            {
                type: 'quote',
                before: info => `<div class="quote"><p class="title">${info}</p>`,
                after: '</div>'
            },
        ],
        ['vuepress-plugin-container',
            {
                type: 'not-print',
                defaultTitle: ''
            },
        ],
        [
            '@vuepress/google-analytics',
            {
                'ga': 'UA-162170924-1'
            }
        ],
        [
            'vuepress-plugin-comment',
            {
                choosen: 'gitalk',
                options: {
                    clientID: 'acf59fc06b2cf691903d',
                    clientSecret: '4cbf25bbf327f1164627d2ab43263b07b14c54fe',
                    repo: 'awesome-fenix',
                    owner: 'fenixsoft',
                    admin: ['fenixsoft'],
                    labels: ["Gitalk", "Comment"],
                    id: '<%- ("icyfenix.cn" + (frontmatter.to.path || window.location.pathname)).slice(-50) %>',
                    title: '「Comment」<%- window.location.origin + (frontmatter.to.path || window.location.pathname) %>',
                    body: '<%- window.location.origin + (frontmatter.to.path || window.location.pathname) %>',
                    distractionFreeMode: false
                }
            }
        ],
        ['@vuepress/back-to-top'],
        [require('./plugins/read-time')],
        [require('./plugins/export')]
    ],
    markdown: {
        anchor: {permalink: false},
        toc: {includeLevel: [2, 3]},
        extendMarkdown: md => {
            md.use(require('markdown-it-mermaid').default);
            md.use(require('markdown-it-sub'));
            md.use(require('markdown-it-sup'));
            md.use(require('markdown-it-abbr'));
            md.use(require('markdown-it-ins'));
            md.use(require('markdown-it-figure'));
            md.use(require('markdown-it-smartarrows'));
        }
    },
    themeConfig: {
        logo: '/images/logo-color.png',
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
                    }, {
                        text: '后端：单体架构 SpringBoot',
                        link: 'https://github.com/fenixsoft/monolithic_arch_springboot'
                    }, {
                        text: '后端：微服务架构 SpringCloud',
                        link: 'https://github.com/fenixsoft/microservice_arch_springcloud'
                    }, {
                        text: '后端：微服务架构 Kubernetes',
                        link: 'https://github.com/fenixsoft/microservice_arch_kubernetes'
                    }, {
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
                children: [
                    '/introduction/about-me',
                    '/introduction/about-the-fenix-project'
                ]
            }, {
                title: '探索起步',
                collapsable: false,
                children: [
                    {
                        title: '✔️ 如何开始',
                        path: '/deployment/development-env-setup/',
                        collapsable: false,
                        children: [
                            '/deployment/development-env-setup/fenix-bookstore-frontend',
                            '/deployment/development-env-setup/monolithic_arch_springboot',
                            '/deployment/development-env-setup/microservice_arch_springcloud',
                            '/deployment/development-env-setup/microservice_arch_kubernetes',
                            '/deployment/development-env-setup/serverless_arch_knative'
                        ]
                    }, {
                        title: '✔️ 环境依赖',
                        path: '/deployment/deployment-env-setup/',
                        collapsable: false,
                        children: ['/deployment/deployment-env-setup/setup-docker', {
                            title: '✔️ 部署Kubernetes集群',
                            path: '/deployment/deployment-env-setup/setup-kubernetes',
                            children: [
                                '/deployment/deployment-env-setup/setup-kubernetes/setup-kubeadm',
                                '/deployment/deployment-env-setup/setup-kubernetes/setup-rancher',
                                '/deployment/deployment-env-setup/setup-kubernetes/setup-minikube'
                            ]
                        }]
                    }, {
                        title: '运维环境',
                        path: '/deployment/operation-env-setup',
                        children: [
                            '/deployment/operation-env-setup/elk-setup',
                            '/deployment/operation-env-setup/devops-setup'
                        ]
                    }]
            }, {
                title: '设计者的视角',
                collapsable: false,
                children: [
                    {
                        title: '✔️ 架构的普适问题',
                        collapsable: false,
                        path: '/architect-perspective/general-architecture',
                        children: [
                            '/architect-perspective/general-architecture/api-style.md',
                            '/architect-perspective/general-architecture/system-security',
                            '/architect-perspective/general-architecture/transaction',
                            '/architect-perspective/general-architecture/diversion-system',
                            '/architect-perspective/general-architecture/concurrent-access'
                        ]
                    }, {
                        title: '方法论',
                        collapsable: false,
                        children: [
                            '/architect-perspective/methodology/layered-system',
                            '/architect-perspective/methodology/capacity-design',
                            '/architect-perspective/methodology/constraint',
                            '/architect-perspective/methodology/testability'
                        ]
                    }, {
                        title: '技巧与专题',
                        collapsable: false,
                        children: [
                            '/architect-perspective/tricks/graalvm-improvement',
                            '/architect-perspective/tricks/cqrs'
                        ]
                    }]
            }, {
                title: '演进中的微服务',
                collapsable: false,
                children: [
                    '/architecture/architect-history',
                    {
                        title: '单体架构',
                        path: '/architecture/monolithic-architecture',
                        collapsable: false,
                        children: [
                            '/architecture/monolithic-architecture/j2ee-base-arch',
                            '/architecture/monolithic-architecture/springboot-base-arch'
                        ]
                    }, {
                        title: '微服务架构',
                        path: '/architecture/microservices-architecture',
                        collapsable: false,
                        children: [
                            '/architecture/microservices-architecture/springcloud-base-arch',
                            '/architecture/microservices-architecture/kubernetes-base-arch',
                            '/architecture/microservices-architecture/servicemesh-lstio-arch'
                        ]
                    }, {
                        title: '无服务架构',
                        path: '/architecture/serverless-architecture',
                        collapsable: false,
                        children: [
                            '/architecture/serverless-architecture/serverless-arch-knative',
                            '/architecture/serverless-architecture/serverless-arch-kubeless'
                        ]
                    }
                ]
            }, {
                title: '核心技术支撑点',
                collapsable: false,
                children: [
                    '/technology/service-discovery',
                    '/technology/load-balancing',
                    {
                        title: '链路治理',
                        path: '/technology/invokechain-manage',
                        collapsable: false,
                        children: [
                            '/technology/invokechain-manage/traffic-control',
                            '/technology/invokechain-manage/service-downgrade',
                            '/technology/invokechain-manage/exception-inject',
                            '/technology/invokechain-manage/invokechain-trace'
                        ]
                    },
                    '/technology/logging',
                    '/technology/configuration',
                    '/technology/message-queue-bus'
                ]
            }, {
                title: '不可变基础设施',
                collapsable: false,
                children: [
                    {
                        title: '网络',
                        path: '/immutable-infrastructure/network',
                        collapsable: false,
                        children: [
                            '/immutable-infrastructure/network/kubernetes-cni',
                            '/immutable-infrastructure/network/kubernetes-lb'
                        ]
                    },
                    '/immutable-infrastructure/storage',
                    '/immutable-infrastructure/gpu-support',
                    '/immutable-infrastructure/hardware-schedule'
                ]
            }, {
                title: '产品发布准备',
                collapsable: false,
                children: [
                    '/release/build-script',
                    '/release/continuous-integration',
                    '/release/gated-launch'
                ]
            }
        ]
    }
};
