# graphql-typeorm-error-parser

A utility for parsing graphql errors into form field errors

## Motivation

Writing validations in Typeorm with class-validator is very easy.
When it came to writing the front-end, it felt silly to me to have
to re-write my validations, especially custom validations.

The main problem I faced was that the validation errors come back
deeply nested within the GraphqlError. I found myself wishing for
the ease of Ruby on Rails, where I could simply get the errors for
each field of a form.

This utility aims to parse those deeply nested GraphQLErrors into
something useful for doing field level validation in the UI.

## Usage

### Installation

#### yarn

```bash
yarn add graphql-typeorm-error-parser
```

#### npm

```bash
npm i graphql-typeorm-error-parser
```

### Example

The getFieldErrors method is intended to be used with the `catch` of a `try/catch` block.
Your GraphQL backend should simply throw any errors from class-validator, the typeorm query failing, or other errors.

```javascript
import { getFieldErrors } from "graphql-typeorm-error-parser";

try {
  await useRegisterMutation({
    variables: {
      email: "joe@email.com",
      password: "weak",
    },
  });
} catch (gqlError) {
  const errors = getFieldErrors(gqlError, {
    fieldErrorValues: {
      as: "string",
      format: "sentence-case",
    },
  });

  console.log(errors);
  /**
   * { password: "Password must be at least 6 characters, Password must include a special character" }
   */
}
```

## Roadmap

- [x] Ability to parse validation errors from class-validator
- [x] Ability to parse query errors from postgres
- [x] Add basic options for the format errors are returned in
