# hello world app with cq-ts

this is a sample repository to illustrate how cq-ts works, it is composed of two small applicatives and a shared library where our endpoint definitions live:

- `client`: (very) simple client app using `cq-ts-http`
- `server`: (very) simple server app using `cq-ts-http` and `cq-ts-express`
- `shared`: (very) simple library containing our endpoints and `io-ts` models

## run it

First of all install all the dependencies with `yarn install`, then start the server.

> **N.B.** be careful that if you must not have a `node_modules` folder higher up in the directory chain to avoid clashes (this means that if you already installed the root folder dependencies you must first delete the root level `node_modules`):

To start the server just run from the root folder:

```
yarn server start
```

then run the client:

```
yarn client start
```

now go to http://localhost:8080 and you should have your (very) simple web app up and running.
