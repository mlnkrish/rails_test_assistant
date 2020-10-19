# Rails Test Assistant

Easily navigate to Rails tests and execute them without leaving VS Code.

## Features

* Swap between a class and its test.
* Execute the test at the current cursor.
* Support for both `*_test.rb` and `*_spec.rb`.

## Extension Settings

This extension contributes the following settings:

* `railsTestAssistant.testCommandPrefix`: Prefix the `rails test` command to suit your environment. For example, a prefix of `docker-compose run --rm web` would direct the test command to your `web` docker container.
