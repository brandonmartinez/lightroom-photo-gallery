#!/usr/bin/env bash

echo "Setting the Node version"
nvm install
nvm use

echo "Installing the NPM packages"
npm install

echo "Updating Create React App"
npm install react-scripts@latest

echo "Creating environment file if it doesn't exist"
[ ! -f .env ] && cp .envsample .env