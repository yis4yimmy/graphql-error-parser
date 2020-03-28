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

## Roadmap

* [ ] Ability to parse validation errors from class-validator
* [ ] Ability to parse query errors from postgres
