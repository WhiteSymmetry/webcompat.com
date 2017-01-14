/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*eslint no-console: ["error", { allow: ["log", "error"] }] */

define([
  'intern',
  'intern!object',
  'require',
  'intern/dojo/node!leadfoot/helpers/pollUntil',
], function(intern, registerSuite, require, pollUntil) {
  'use strict';

  var config = intern.config;

  var url = function(path) {
    return config.siteRoot + path;
  };

  var manualLoginDelay = config.wc.loginDelay ? 10000 : 0;

  function takeScreenshot() {
    return function() {
      return this.parent.takeScreenshot()
        .then(function(buffer) {
          console.error('Capturing base64 screenshot:');
          console.error(buffer.toString('base64'));
        });
    };
  }

  function openPage(context, url, readySelector) {
    return context.remote
      .get(require.toUrl(url))
      .setFindTimeout(config.wc.pageLoadTimeout)

      // Wait until the `readySelector` element is found to return.
      .findByCssSelector(readySelector)
      .end()

      .then(null, function(err) {
        return context.remote
          .getCurrentUrl()
            .then(function(resultUrl) {
              console.log('Error fetching %s, now at %s', url, resultUrl);
            })
          .end()

          .then(takeScreenshot())

          .then(function() {
            throw err;
          });
      });
  }

  function login(context) {
    return openPage(context, url('/login'), 'body')
      .getCurrentUrl()
      .then(function(url) {
        if (url.includes('github')) {
          return context.remote
            .findByCssSelector('#login_field').click()
              .type(config.wc.user)
            .end()
            .findByCssSelector('#password').click()
              .type(config.wc.pw)
            .end()
            .findByCssSelector('input[type=submit]').submit()
            .end()
            // *Sometimes* GitHub can bring up an extra verification
            // page if it detects that our test user is requesting
            // access too much. In that case, there's an extra button to click.
            // Otherwise, there won't be so we swallow the NoSuchElement error.
            .findByCssSelector('button.btn-primary').then(function(el) {
              el.click();
            }, function(err) {
              return new Promise(function(resolve) {
                if (/NoSuchElement/.test(String(err))) {
                  resolve(true);
                }
              });
            })
            .end()
            // allow time for local test entry of github auth code
            .sleep(manualLoginDelay);
        }
      });
  }

  function logout(context) {
    // log out.
    return openPage(context, url('/logout'), 'body');
  }

  function hardLogout(context) {
    // log out, clear cookies, and kill the session from GitHub.
    return context.remote
      .setFindTimeout(config.wc.pageLoadTimeout)
      .get(require.toUrl(url('/logout')))
      .end()
      .clearCookies()
      .end()
      .get(require.toUrl('https://github.com/logout'))
      .findByCssSelector('input.btn').click()
      .end();
  }

  function visibleByClass(selector) {
    var elem;
    return pollUntil(function(selector) {
      elem = document.getElementsByClassName(selector);
      if (!elem || elem.length === 0) { return null; }
      elem = elem[0];
      return (elem.offsetWidth > 0 && elem.offsetHeight > 0) ? true : null;
    }, [ selector], 10000);
  }

  return {
    hardLogout: hardLogout,
    login: login,
    logout: logout,
    openPage: openPage,
    takeScreenshot: takeScreenshot,
    visibleByClass: visibleByClass
  };
});
