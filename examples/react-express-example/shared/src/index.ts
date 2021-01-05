import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import { Query } from 'cq-ts-http';

const User = t.strict({
  name: t.string,
  surname: t.string,
  age: t.number,
});

export const getUser = Query({
  Method: 'GET',
  getPath: ({ id }) => `user/${id}`,
  Output: t.strict({ user: User }),
  Input: {
    Params: { id: NumberFromString },
  },
});
