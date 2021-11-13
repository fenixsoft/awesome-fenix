module.exports = {
  title: '凤凰架构',
  description: '构建可靠的大型分布式系统',
  head: [
    ['link', {rel: 'shortcut icon', type: "image/x-icon", href: `/favicon.ico`}]
  ],
  host: '0.0.0.0',
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
          // 如果你对"clientSecret"有疑问,可以参考 http://icyfenix.cn/architect-perspective/general-architecture/system-security/authorization.html#oauth2
          clientSecret: '4cbf25bbf327f1164627d2ab43263b07b14c54fe',
          repo: 'awesome-fenix',
          owner: 'fenixsoft',
          admin: ['fenixsoft'],
          labels: ["Gitalk", "Comment"],
          id: '<%- ("icyfenix.cn" + (frontmatter.to.path || window.location.pathname)).slice(-50) %>',
          title: '「Comment」<%- window.location.origin + (frontmatter.to.path || window.location.pathname) %>',
          body: '<%- window.location.origin + (frontmatter.to.path || window.location.pathname) %>',
          distractionFreeMode: false,
          pagerDirection: 'last',
          // proxy: 'https://netnr-proxy.cloudno.de/https://github.com/login/oauth/access_token'
          proxy: 'https://fenixsoft-cors.herokuapp.com/https://github.com/login/oauth/access_token'
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
      md.use(require('markdown-it-fontawesome'));
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
            text: '后端：无服务架构 AWS Lambda',
            link: 'https://github.com/fenixsoft/serverless_arch_awslambda'
          }
        ]
      },
      {
        text: 'PDF下载',
        link: 'https://raw.githubusercontent.com/fenixsoft/awesome-fenix/gh-pages/pdf/the-fenix-project.pdf',
        target: "_blank"
      },
      {text: '讨论区', link: '/board/', target: "_self"}
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
          '/introduction/about-book',
          '/introduction/about-the-fenix-project',
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
            title: '技术演示工程',
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
            title: '服务架构演进史',
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
        ]
      }, {
        title: '架构师的视角',
        collapsable: false,
        children: [
          {
            title: '访问远程服务',
            collapsable: false,
            path: '/architect-perspective/general-architecture/api-style/',
            children: [
              '/architect-perspective/general-architecture/api-style/rpc',
              '/architect-perspective/general-architecture/api-style/rest',
              // '/architect-perspective/general-architecture/api-style/mq',
            ]
          },
          {
            title: '事务处理',
            collapsable: false,
            path: '/architect-perspective/general-architecture/transaction/',
            children: [
              '/architect-perspective/general-architecture/transaction/local',
              '/architect-perspective/general-architecture/transaction/global',
              '/architect-perspective/general-architecture/transaction/share',
              '/architect-perspective/general-architecture/transaction/distributed',
            ]
          },
          {
            title: '透明多级分流系统',
            collapsable: false,
            path: '/architect-perspective/general-architecture/diversion-system/',
            children: [
              '/architect-perspective/general-architecture/diversion-system/client-cache',
              '/architect-perspective/general-architecture/diversion-system/dns-lookup',
              '/architect-perspective/general-architecture/diversion-system/transmission-optimization',
              '/architect-perspective/general-architecture/diversion-system/cdn',
              '/architect-perspective/general-architecture/diversion-system/load-balancing',
              '/architect-perspective/general-architecture/diversion-system/cache-middleware',
              // '/architect-perspective/general-architecture/diversion-system/scalability'
            ]
          },
          {
            title: '架构安全性',
            collapsable: false,
            path: '/architect-perspective/general-architecture/system-security/',
            children: [
              '/architect-perspective/general-architecture/system-security/authentication',
              '/architect-perspective/general-architecture/system-security/authorization',
              '/architect-perspective/general-architecture/system-security/credentials',
              '/architect-perspective/general-architecture/system-security/confidentiality',
              '/architect-perspective/general-architecture/system-security/transport-security',
              '/architect-perspective/general-architecture/system-security/verification',
              // '/architect-perspective/general-architecture/system-security/exploit'
            ]
          },
        ]
      }, {
        title: '分布式的基石',
        collapsable: false,
        children: [
          {
            title: '分布式共识算法',
            path: '/distribution/consensus/',
            collapsable: false,
            children: [
              '/distribution/consensus/paxos',
              '/distribution/consensus/raft',
              '/distribution/consensus/gossip',
            ]
          },
          {
            title: '从类库到服务',
            path: '/distribution/connect/',
            collapsable: false,
            children: [
              '/distribution/connect/service-discovery',
              '/distribution/connect/service-routing',
              '/distribution/connect/load-balancing',
              // '/distribution/connect/composer',
              // '/distribution/connect/configuration',
            ]
          },
          {
            title: '流量治理',
            path: '/distribution/traffic-management/',
            collapsable: false,
            children: [
              '/distribution/traffic-management/failure',
              '/distribution/traffic-management/traffic-control',
            ]
          },
          {
            title: '可靠通讯',
            path: '/distribution/secure/',
            collapsable: false,
            children: [
              '/distribution/secure/zero-trust',
              '/distribution/secure/service-security',
            ]
          },
          {
            title: '可观测性',
            path: '/distribution/observability/',
            collapsable: false,
            children: [
              '/distribution/observability/logging',
              '/distribution/observability/tracing',
              '/distribution/observability/metrics',
            ]
          },
        ]
      }, {
        title: '不可变基础设施',
        collapsable: false,
        children: [
          '/immutable-infrastructure/msa-to-cn',
          {
            title: '虚拟化容器',
            path: '/immutable-infrastructure/container/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/container/history',
              '/immutable-infrastructure/container/container-build-system',
              '/immutable-infrastructure/container/application-centric',
            ]
          },
          {
            title: '容器间网络',
            path: '/immutable-infrastructure/network/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/network/linux-vnet',
              '/immutable-infrastructure/network/cni',
            ]
          },
          {
            title: '持久化存储',
            path: '/immutable-infrastructure/storage/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/storage/storage-evolution',
              '/immutable-infrastructure/storage/csi',
            ]
          },
          '/immutable-infrastructure/schedule/hardware-schedule',
          // {
          //   title: '资源调度',
          //   path: '/immutable-infrastructure/schedule/',
          //   collapsable: false,
          //   children: [
          //     '/immutable-infrastructure/schedule/hardware-schedule',
          //     // '/immutable-infrastructure/schedule/resilience',
          //     // '/immutable-infrastructure/schedule/elasticity',
          //   ]
          // },
          // {
          //   title: '可扩展设计',
          //   path: '/immutable-infrastructure/extension/',
          //   collapsable: false,
          //   children: [
          //     '/immutable-infrastructure/extension/crd',
          //     '/immutable-infrastructure/extension/operator',
          //     '/immutable-infrastructure/extension/api-server',
          //   ]
          // },
          {
            title: '服务网格',
            path: '/immutable-infrastructure/mesh/',
            collapsable: false,
            children: [
              '/immutable-infrastructure/mesh/communication',
              '/immutable-infrastructure/mesh/ecosystems',
            ]
          },
        ]
      }, {
        title: '技术方法论',
        collapsable: false,

        children: [
          {
            title: '向微服务迈进',
            path: '/methodology/forward-msa/',
            collapsable: false,
            children: [
              '/methodology/forward-msa/objective',
              '/methodology/forward-msa/prerequest',
              '/methodology/forward-msa/granularity',
              '/methodology/forward-msa/governance',
              // '/methodology/forward-msa/measurement',
              // '/methodology/forward-msa/risk',
            ]
          }
          // , {
          //   title: '架构设计模式',
          //   collapsable: false,
          //   children: [
          //     {
          //       title: '事件驱动架构',
          //       path: '/methodology/pattern/events/',
          //       collapsable: false,
          //       children: [
          //         '/methodology/pattern/events/es',
          //         '/methodology/pattern/events/cqrs',
          //         '/methodology/pattern/events/cep',
          //       ]
          //     },
          //     '/methodology/pattern/afk',
          //     '/methodology/pattern/orchestration',
          //   ]
          // },
        ]
      }, {
        title: '随笔文章',
        collapsable: false,
        children: [
          {
            title: '2020年',
            collapsable: false,
            children: [
              {
                title: 'Graal VM',
                collapsable: false,
                path: '/tricks/2020/graalvm/',
                children: [
                  '/tricks/2020/graalvm/graal-compiler',
                  '/tricks/2020/graalvm/substratevm',
                  '/tricks/2020/graalvm/graalvm-native',
                  '/tricks/2020/graalvm/spring-over-graal',
                ]
              },
              '/tricks/2020/java-crisis/qcon',
            ]
          },
          {
            title: '2021年',
            collapsable: false,
            children: [
              '/tricks/2021/openjdk-for-dummies/',
              '/tricks/2021/geekbang.md',
              '/tricks/2021/fenix-cli/',
              '/tricks/2021/arch/',
            ]
          },
        ]
      }
      , {
        title: '附录',
        collapsable: false,
        children: [
          // '/appendix/build-script',
          // '/appendix/continuous-integration',
          // '/appendix/gated-launch',
          {
            title: '部署环境',
            path: '/appendix/deployment-env-setup/',
            collapsable: false,
            children: ['/appendix/deployment-env-setup/setup-docker', {
              title: '部署Kubernetes集群',
              path: '/appendix/deployment-env-setup/setup-kubernetes/',
              children: [
                '/appendix/deployment-env-setup/setup-kubernetes/setup-kubeadm',
                '/appendix/deployment-env-setup/setup-kubernetes/setup-rancher',
                '/appendix/deployment-env-setup/setup-kubernetes/setup-minikube',
              ]
            }]
          },
          '/appendix/istio',
          '/appendix/operation-env-setup/elk-setup',
          '/appendix/operation-env-setup/prometheus-setup',
          // {
          //   title: '运维环境',
          //   path: '/appendix/operation-env-setup/',
          //   collapsable: false,
          //   children: [
          //     '/appendix/operation-env-setup/elk-setup',
          //     '/appendix/operation-env-setup/prometheus-setup'
          //   ]
          // }
        ]
      }
    ]
  }
};
