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
    require('./plugins/read-time'),
    require('./plugins/export')
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
    // repo: 'fenixsoft/awesome-fenix',
    editLinks: true,
    editLinkText: '在GitHub中编辑',
    // 添加导航栏
    nav: [
      {text: '首页', link: '/'}, {
        text: '代码',
        // 这里是下拉列表展现形式。
        items: [
          {
            text: '文档工程 Awesome-Fenix',
            link: 'https://github.com/fenixsoft/awesome-fenix'
          }, {
            text: '前端工程 Fenix\'s Bookstore',
            link: 'https://github.com/fenixsoft/fenix-bookstore-frontend'
          }, {
            text: '前端工程在线示例 Fenix\'s Bookstore',
            link: 'https://bookstore.icyfenix.cn'
          }, {
            text: '后端：单体架构 Spring Boot',
            link: 'https://github.com/fenixsoft/monolithic_arch_springboot'
          }, {
            text: '后端：微服务架构 Spring Cloud',
            link: 'https://github.com/fenixsoft/microservice_arch_springcloud'
          }, {
            text: '后端：微服务架构 Kubernetes',
            link: 'https://github.com/fenixsoft/microservice_arch_kubernetes'
          }, {
            text: '后端：微服务架构 Istio',
            link: 'https://github.com/fenixsoft/servicemesh_arch_istio'
          }, {
            text: '后端：无服务架构 Serverless',
            link: 'https://github.com/fenixsoft/serverless_arch'
          }
        ]
      },
      {text: 'PDF下载', link: 'https://icyfenix.cn/pdf/the-fenix-project.pdf', target: "_blank"},
      {text: '讨论区', link: '/board', target: "_self"}
    ],
    sidebar: [
      {
        title: '目录',
        collapsable: false,
        path: '/SUMMARY.md'
      }, {
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
            title: '阅读指引',
            collapsable: false,
            children: [
              '/CHANGELOG.md',
              '/exploration/guide/quick-start',
            ]
          },
          {
            title: '✔️ 技术演示工程',
            collapsable: false,
            path: '/exploration/projects/',
            children: [
              '/exploration/projects/fenix-bookstore-frontend',
              '/exploration/projects/monolithic_arch_springboot',
              '/exploration/projects/microservice_arch_springcloud',
              '/exploration/projects/microservice_arch_kubernetes',
              '/exploration/projects/servicemesh_arch_istio',
              '/exploration/projects/serverless_arch'
            ]
          }]
      }, {
        title: '演进中的架构',
        collapsable: false,
        children: [
          {
            title: '✔️ 服务架构演进史',
            path: '/architecture/architect-history/',
            collapsable: false,
            children: [
              '/architecture/architect-history/primitive-distribution',
              '/architecture/architect-history/monolithic',
              '/architecture/architect-history/soa',
              '/architecture/architect-history/microservices',
              '/architecture/architect-history/post-microservices',
              '/architecture/architect-history/serverless'
            ]
          }
          // ,
          // {
          //   title: '从架构到实现',
          //   collapsable: false,
          //   children: [
          //     '/architecture/architect-framework/j2ee-base-arch',
          //     '/architecture/architect-framework/springboot-base-arch',
          //     '/architecture/architect-framework/springcloud-base-arch',
          //     '/architecture/architect-framework/kubernetes-base-arch',
          //     '/architecture/architect-framework/servicemesh-lstio-arch',
          //     '/architecture/architect-framework/serverless-arch-knative',
          //     '/architecture/architect-framework/serverless-arch-kubeless'
          //   ]
          // }
        ]
      }, {
        title: '设计者的视角',
        collapsable: false,
        children: [
          {
            title: '✔️ 架构的普适问题',
            collapsable: false,
            path: '/architect-perspective/general-architecture/',
            children: [
              {
                title: '✔️ 服务风格设计',
                path: '/architect-perspective/general-architecture/api-style/',
                children: [
                  '/architect-perspective/general-architecture/api-style/rpc',
                  '/architect-perspective/general-architecture/api-style/rest',
                  '/architect-perspective/general-architecture/api-style/mq',
                ]
              },
              {
                title: '✔️ 事务处理',
                path: '/architect-perspective/general-architecture/transaction/',
                children: [
                  '/architect-perspective/general-architecture/transaction/local',
                  '/architect-perspective/general-architecture/transaction/global',
                  '/architect-perspective/general-architecture/transaction/share',
                  '/architect-perspective/general-architecture/transaction/distributed',
                ]
              },
              {
                title: '✔️ 透明多级分流系统',
                path: '/architect-perspective/general-architecture/diversion-system/',
                children: [
                  '/architect-perspective/general-architecture/diversion-system/client-cache',
                  '/architect-perspective/general-architecture/diversion-system/dns-lookup',
                  '/architect-perspective/general-architecture/diversion-system/transmission-optimization',
                  '/architect-perspective/general-architecture/diversion-system/cdn',
                  '/architect-perspective/general-architecture/diversion-system/load-balancing',
                  '/architect-perspective/general-architecture/diversion-system/cache-middleware',
                  '/architect-perspective/general-architecture/diversion-system/database-expansion'
                ]
              },
              {
                title: '✔️ 安全架构',
                path: '/architect-perspective/general-architecture/system-security/',
                children: [
                  '/architect-perspective/general-architecture/system-security/authentication',
                  '/architect-perspective/general-architecture/system-security/authorization',
                  '/architect-perspective/general-architecture/system-security/credentials',
                  '/architect-perspective/general-architecture/system-security/confidentiality',
                  '/architect-perspective/general-architecture/system-security/transport-security',
                  '/architect-perspective/general-architecture/system-security/verification',
                  '/architect-perspective/general-architecture/system-security/exploit'
                ]
              },
              {
                title: '高效并发',
                path: '/architect-perspective/general-architecture/concurrent/',
                children: [
                  '/architect-perspective/general-architecture/concurrent/process-thread-coroutine',
                  '/architect-perspective/general-architecture/concurrent/thread-safe',
                  '/architect-perspective/general-architecture/concurrent/synchronization',
                  '/architect-perspective/general-architecture/concurrent/hardware-concurrent',
                ]
              }
            ]
          }, {
            title: '设计方法论',
            collapsable: false,
            children: [
              '/architect-perspective/methodology/layered-system',
              '/architect-perspective/methodology/capacity-design',
              '/architect-perspective/methodology/constraint',
            ]
          }
        ]
      }, {
        title: '分布式的基石',
        collapsable: false,
        children: [
          {
            title: '✔️ 分布式共识算法',
            path: '/distribution/consensus/',
            collapsable: false,
            children: [
              '/distribution/consensus/paxos',
              '/distribution/consensus/raft',
              '/distribution/consensus/gossip',
            ]
          },
          {
            title: '服务互联',
            // path: '/distribution/connect/',
            collapsable: false,
            children: [
              '/distribution/connect/service-discovery',
              '/distribution/connect/service-routing',
              '/distribution/connect/load-balancing',
              '/distribution/connect/composer',
              '/distribution/connect/configuration',
            ]
          },
          {
            title: '流量管控',
            // path: '/distribution/traffic-management/',
            collapsable: false,
            children: [
              '/distribution/traffic-management/isolation',
              '/distribution/traffic-management/breaker',
              '/distribution/traffic-management/timeout',
              '/distribution/traffic-management/traffic-control',
              '/distribution/traffic-management/service-downgrade',
              '/distribution/traffic-management/exception-inject',
            ]
          },
          {
            title: '可靠通讯',
            // path: '/distribution/secure/',
            collapsable: false,
            children: [
              '/distribution/secure/traffic-encryption',
              '/distribution/secure/access-policies',
              '/distribution/secure/auditing',
            ]
          },
          {
            title: '可观测性',
            // path: '/distribution/observability/',
            collapsable: false,
            children: [
              '/distribution/observability/logging',
              '/distribution/observability/invokechain-trace',
              '/distribution/observability/apm',
            ]
          },
        ]
      }, {
        title: '不可变基础设施',
        collapsable: false,
        children: [
          '/immutable-infrastructure/history',
          {
            title: '虚拟化容器',
            path: '/immutable-infrastructure/container/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/container/cri',
              '/immutable-infrastructure/container/resource-isolation',
              '/immutable-infrastructure/container/resource',
              '/immutable-infrastructure/container/manage',
            ]
          },
          {
            title: '容器间网络',
            path: '/immutable-infrastructure/network/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/network/cni',
              '/immutable-infrastructure/network/strategy',
              '/immutable-infrastructure/network/plugin',
              '/immutable-infrastructure/network/container-lb'
            ]
          },
          {
            title: '配置与数据持久化',
            path: '/immutable-infrastructure/storage/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/storage/csi',
              '/immutable-infrastructure/storage/dfs',
              '/immutable-infrastructure/storage/storage-plugins'
            ]
          },
          {
            title: 'GPU虚拟化',
            path: '/immutable-infrastructure/gpu/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/gpu/device-plugin',
              '/immutable-infrastructure/gpu/gpu-schedule',
              '/immutable-infrastructure/gpu/nvidia'
            ]
          },
          {
            title: '扩展基础设施',
            path: '/immutable-infrastructure/extension/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/extension/crd',
              '/immutable-infrastructure/extension/api-server',
            ]
          },
          '/immutable-infrastructure/hardware-schedule',
        ]
      }, {
        title: '技巧与专题',
        collapsable: false,
        children: [
          {
            title: '✔️ Graal VM',
            collapsable: false,
            path: '/tricks/graalvm/',
            children: [
              '/tricks/graalvm/graal-compiler',
              '/tricks/graalvm/substratevm',
              '/tricks/graalvm/graalvm-native',
              '/tricks/graalvm/spring-over-graal'
            ]
          },
          '/tricks/responsive-programming',
          '/tricks/lambda-stream',
          '/tricks/aio'
        ]
      }
      , {
        title: '附录',
        collapsable: false,
        children: [
          '/appendix/build-script',
          '/appendix/continuous-integration',
          '/appendix/gated-launch',
          {
            title: '✔️ 环境依赖',
            path: '/appendix/deployment-env-setup/',
            collapsable: false,
            children: ['/appendix/deployment-env-setup/setup-docker', {
              title: '✔️ 部署Kubernetes集群',
              path: '/appendix/deployment-env-setup/setup-kubernetes/',
              children: [
                '/appendix/deployment-env-setup/setup-kubernetes/setup-kubeadm',
                '/appendix/deployment-env-setup/setup-kubernetes/setup-rancher',
                '/appendix/deployment-env-setup/setup-kubernetes/setup-minikube'
              ]
            }]
          }, {
            title: '运维环境',
            path: '/appendix/operation-env-setup/',
            children: [
              '/appendix/operation-env-setup/elk-setup',
              '/appendix/operation-env-setup/devops-setup'
            ]
          }
        ]
      }
    ]
  }
};
