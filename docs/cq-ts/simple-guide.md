---
id: simple-guide
title: simple guide to start with `cq-ts`
---

### peer deps:
- io-ts (all)
- fp-ts (all)
- remote-data-ts (cq-ts-react)

### packages
- cq-ts-http
- cq-ts-browser
- cq-ts-react
- cq-ts-express

First define your endpoints:

```ts
import * as t from 'io-ts';
import { HTTPCommand, HTTPQuery } from 'cq-ts-http';
import { User } from "../dto.ts"

export const notFoundError = t.type({
  status: t.literal(404),
  message: t.string,
})

export const serverError = t.type({
  status: t.literal(500),
  message: t.string,
})

export const getUserById = HTTPQuery({
  Input: {
    Params: { userId: NumberFromString },
  },
  Output: t.strict({ user: User }),
  getPath: ({ id }) => `users/${id}`,
  Errors: [notFoundError, serverError],
});

export const getUsers = HTTPQuery({
  Output: t.strict({ users: t.array(User) }),
  getPath: () => `users`,
  Errors: [serverError],
});

const createUser = HTTPCommand({
  Input: {
    Body: t.strict({
      name: t.string,
      surname: t.string,
      age: t.number,
    }),
  },
  method: "POST", // default is post (can be post/put/delete)
  Output: t.strict({ id: t.string }),
  Errors: [serverError],
  getPath: () => 'users',
});


const modifyUser = HTTPCommand({
  Input: {
    Params: {
      id: t.string
    },
    Body: t.strict({
      name: t.string,
      surname: t.string,
      age: t.number,
    }),
  },
  Output: t.void, // default is t.void
  Errors: [serverError],
  getPath: ({ id }) => `user/${id}`,
});
```

Compose and map them anyway you want to:
```ts
import { getUserId, getUserById } from 'shared';

export const getUserId = HTTPQuery({
  Input: {
    Params: { userName: t.string },
  },
  Output: t.strict({ user: User }),
  getPath: ({ id }) => `users/${id}`,
  Errors: [notFoundError, serverError],
});

```


Then add implementations to your express server:

```ts
import express from 'express';
import { getUserById } from 'shared';
import { bindRouter } from 'cq-ts-express';
import * as TA from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';

const database = [
  { id: 1, name: 'John', surname: 'Doe', age: 22 },
  { id: 2, name: 'Michael', surname: 'Black', age: 51 },
];

function getUserFromDB(id: number) {
  return TA.fromEither(E.fromNullable('user not found')(database.find((u) => u.id === id)));
}

const app = express();

const router = express.Router();

const implementEndpoint = bindRouter(router)

// the function forces you to return an Either<getUserById.Errors, getUserById.Output>
implementEndpoint(getUserById)(({ params: { id } }) => {
  const user = getUserFromDB(id);

  return pipe(
    user,
    TA.mapLeft((e) => ({ status: 404, message: "not found" }),
    TA.map((userFromDB) => ({
      body: { user: userFromDB },
      statusCode: 200,
    }))
  );
});

app.use(router);

app.listen(3000, () => {});
```

Then derive your react hooks for it:

```tsx
import * as React from "react"
import * as TA from "fp-ts/lib/TaskEither"
import * as O from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/function"
import { useQuery, useCommand, getQuery, getCachedShallowQuery, getCommand } from 'cq-ts-react';
import { shallow, deep } from 'cq-ts-react/InputEq';
import { cacheFirst, remoteFirst, timeout } from 'cq-ts-react/Strategy';
import { getUserById, getUsers, modifyUser } from 'shared';

interface Props {
  activeUserId: string
}

const userQuery = getQuery(getUserById, { inputEq: shallow, strategy: cacheFirst })
const usersQuery = getCachedShallowQuery(getUsers)
const createUserCommand = getCommand(modifyUser)
const modifyUserCommand = getCommand(modifyUser)

const Users: React.FC<Props> = ({ activeUserId }) => {
  const [modifyError, setModifyError] = useState(O.none)
  const [activeUser, invalidate] = useQuery(userQuery, { params: { userId: activeUserId } })
  const [users: { data: RemoteData<User[]>, fetching: boolean }, invalidate: IO<void>] = useQuery(usersQuery)

  const addUser = useCommand(createUserCommand, [usersQuery]) // invalidates users query
  const modifyUser = useCommand(modifyUserCommand, [usersQuery, [userQuery, (({ Params: { id } }) => [{ Params: { userId: id } }]]]) // invalidates userQuery query with the same id of the modified user (returns a taskeither)

  return (
    <div>
      {pipe(
        users.data,
        fold3(
          () => "loading...",
          () => "there was an error",
          (users) => users.fetching
            ? "loading..."
            : users.map(u => (
              <div>
                <div>{u.name}</div>
                <button
                  onClick={pipe(
                    modifyUser({ Params: { id: u.id }, Body: { name: "John" } }),
                    TA.mapLeft(e => setModifyError(O.some(e)))
                  )}
                >
                  modify user
                </button>
              </div>
            ))
        )
      )}
    </div>
  )
}

export default Users
```

