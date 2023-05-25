# deepdataspace-app

**DeepDataSpace Tool Frontend**

[![React](https://img.shields.io/static/v1?label=React&message=18&color=blue)](https://react.dev/) [![UmiJS](https://img.shields.io/static/v1?label=UmiJS&message=4.0&color=green)](https://umijs.org/) [![AntDesign](https://img.shields.io/static/v1?label=AntDesign&message=5.4&color=yellow)](https://ant.design/) [![ahooks](https://img.shields.io/static/v1?label=ahooks&message=3.7&color=red)](https://ahooks.js.org/)

## Environment

```sh
# Install pnpm.
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Install node.js env.(If you haven't installed the Node environment yet.)
pnpm env use --global lts
```

## Development

```sh
# Install dependencies.
pnpm i

# Run local server to code
pnpm run dev

# Build the dist file for deployment.
pnpm run build
```

## Directory

```sh
├── .husky                      # Huskry config
├── bin                         # Deployment-related scripts
├── dist                        # Packaged files
├── mock                        # Mock data
├── node_modules                # Dependencies
├── public                      # Static resources（Public）
├── src
│   ├── assets                  # Static resources
│   ├── components              # Common components
│   ├── constants               # Constant definition
│   ├── hooks                   # Common hooks
│   ├── logs                    # Logs
│   ├── models                  # Global models
│   ├── pages                   # Pages
│   │   ├── page1
│   │   │   ├── components      # Page components
│   │   │   ├── models          # Page models
│   │   │   ├── index.less      # Page styles
│   │   │   ├── index.tsx       # Page file
│   ├── services                # Apis
│   ├── utils                   # Common utils
│   ├── app.tsx                 # Main entry
│   ├── global.less             # Global styles
│   └── typings.d.ts            # Global ts define
├── .env                        # Environment variables
├── .env.local                  # Local environment variables (Override .env)
├── .umirc.ts                   # Umi config
├── package.json
├── README.md
├── Dockerfile
├── nginx.conf
├── tsconfig.json
└── typings.d.ts

```

## Data flow

The @umi/max built-in data flow management plugin is used, which is a lightweight data management solution based on the hooks paradigm. It can manage global shared data in Umi projects.

The data flow management plugin uses a convention-based directory structure for management. Here's a brief explanation:：[https://umijs.org/docs/max/data-flow](https://umijs.org/docs/max/data-flow)

#### Commenting guidelines

- Route-related operations are not supported within model.
- Use **usePageModelLifeCycle** in the model to implement lifecycle events and handle page loading and unloading logic.
- Standardize the definition of **pageState** variables in the model and use **usePageModelLifeCycle** to synchronize the URL with **pageState** variables and preserve the state of **pageState** variables to the URL.
