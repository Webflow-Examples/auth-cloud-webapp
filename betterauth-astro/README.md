# Authentication Webapp

A [Webflow Cloud](https://webflow.com/cloud) example app to showcase user authentication functionality. Built with Astro, this app integrates Webflow components via [**DevLink**](https://developers.webflow.com/webflow-cloud/devlink) and uses [**Better Auth**](https://better-auth.com/) for secure user authentication with database persistence.

## ✨ Features

- **User Authentication**: Complete sign-up and login functionality with secure session management
- **Database Integration**: Uses Drizzle ORM with D1 database for user data persistence
- **Webflow Integration**: Uses Webflow DevLink components
- **Session Management**: Secure session handling with middleware protection
- **Responsive Design**: Built with Tailwind CSS and Webflow components for optimal user experience

## 🛠️ Tech Stack

- **Webflow Cloud** - Infrastructure for hosting the webapp alongside a Webflow site, including [Cloudflare D1](https://developers.cloudflare.com/d1/) dependencies
- **Astro.js** - Modern web framework
- **Better Auth** - Authentication library with session management
- **Drizzle ORM** - Type-safe database ORM
- **Tailwind CSS** - Utility-first CSS framework
- **Webflow DevLink** - Syncs design system components from the Webflow site to React components

## 📋 Prerequisites

Make sure you have the following before running the app locally:

- Install Node.js 18+ / npm / Git
- Webflow account ([sign up for free](https://webflow.com/signup))
- Install the [Webflow CLI](https://www.npmjs.com/package/@webflow/webflow-cli)

## 🏗️ Getting Started

### 1. Fork and clone the repository

- Fork this repo into your own repositories so you have a copy of this project to work with
- Clone the repo down to your local machine
- `cd auth-cloud-webapp/astro`

### 2. Clone the Webflow Demo Site

Feel free to use your own Webflow site to attach this Webflow Cloud project to! If you need a starter site template, clone the [Astral Fund demo site](https://webflow.com/made-in-webflow/website/astralfund-919afdc1091df68b8dc1347f952a) into your workspace.

### 3. Gather environment variables

#### Retrieve auth token

Once you have a Webflow site you want to deploy this app on, generate an auth token to use for syncing Webflow components with Devlink:

- In the terminal, run `webflow auth login --force` to authorize the Webflow Cloud app to your site
- Once complete, you should see a `.env` file with the `WEBFLOW_SITE_API_TOKEN` and `WEBFLOW_SITE_ID` variables filled in

#### Create a `.dev.vars` file

- In your editor, duplicate `.dev.vars.template`, rename the copy to `.dev.vars`, and fill in the required values:
  - Set the `WEBFLOW_SITE_ID` and `WEBFLOW_SITE_API_TOKEN` variables with the relevant values from `.env`
  - `BETTER_AUTH_URL`: Set this to your localhost port
  - `BETTER_AUTH_SECRET`: Run the following command in the terminal and set this variable value to the output
    - `openssl rand -base64 32`

### 4. Set up the database

Initialize your Cloudflare D1 database:

```bash
npm run db:generate
npm run db:apply:local
```

### 5. Install and run locally

```bash
npm install
```

```bash
npm run preview
```

The local server will start and automatically show you where to navigate:

```
⎔ Starting local server...
[wrangler:info] Ready on http://localhost:8787/app
```

Open [http://localhost:8787/app](http://localhost:8787/app) in your browser to see the authentication app. You can:

- Sign up for a new account at `/app/signup`
- Log in with existing credentials at `/app/login`
- Access the protected homepage after authentication at `/app`

**Note:** The mount/base path for this Webflow Cloud app is at `/app` by default.

### 7. (Optional) Sync DevLink

This example repo has components already in place from the Webflow template site, but if you make any changes to the components on the Webflow site, you'll need to sync the changes down using the `webflow-cli` devlink tool.

Once your `.env` is set up from step 3, run `webflow devlink sync` in the terminal.

## 🚀 Deploy Webflow Cloud app

Once everything locally works OK, it's time to build and deploy the app to your Webflow site.
First, push up any code changes made to the project to the forked remote GitHub repo.

### Create Webflow Cloud app

> For more detailed guidance on creating a Webflow Cloud app, [see docs here](https://developers.webflow.com/webflow-cloud/bring-your-own-app) for a step-by-step.

In your Webflow site settings, navigate to the **Webflow Cloud** tab, click "Install GitHub App", and follow the prompts so Webflow can access your forked repo.

Back in the Webflow Cloud page, click the "Create New Project" button and follow the prompts accordingly to add your project name, and the location of your GitHub repo. Expand the **Advanced settings** section and in the directory path input, add the subfolder name of this project: `betterauth-astro` so the Cloud app ensures to pull code from this subdirectory.

When you are prompted to create an **Environment**:

1. **Branch** - Select the GitHub branch you're working from (usually `main`)
2. **Mount Path** - Enter the mount path where you want the app to live (e.g., `/app` by default)

After the project is created, click "Publish" to re-publish your Webflow site. Once publishing completes, open your Webflow Cloud project, navigate into the **Environments**, then select the `main` branch name to view **Deployments**.

### Add environment variables

On the **Deployments** page, open the "Environment Variables" tab and add the following environment variables from your `.dev.vars` file:

- `BETTER_AUTH_URL`: set the value to the domain of your Webflow site (i.e. `https://auth-cloud-test.webflow.io`) as opposed to localhost
- `BETTER_AUTH_SECRET`: set the value to a new value by running the following command in the terminal again: `openssl rand -base64 32`. Make sure to mark it as a secret type before creating the variable in Webflow.

### Deploy the app

Click the "Deploy latest commit" button to build and deploy the latest app from your repo.

After a few minutes, you can click the "Environment URL", which should be where the app is deployed to on your site (i.e. `https://{your-site-here}.webflow.io/app`).

At this point, you should be able to test out the sign up/login flow as you did on localhost and verify the functionality works the same. If so, congrats! You've deployed a Webflow Cloud app with an authentication flow 🎉

If you make additional changes to your project, simply push them up to your repo on `main`, and Webflow will automatically kick off a new deployment with your changes. Also, if your deployment build fails for any reason, check the "Deployment History" for more logs.

## Schema Changes

If you modify the database schema:

1. Generate new migrations:
   ```bash
   npm run db:generate
   ```
2. Apply the new migrations:
   ```bash
   npm run db:apply:local
   ```

Commit and push up the changes, and Webflow Cloud will handle applying the migrations to the hosted D1 instance for your Webflow Cloud app.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is MIT licensed.
