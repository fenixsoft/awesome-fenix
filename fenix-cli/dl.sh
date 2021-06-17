#!/bin/sh
set -e

VERSION="$(curl -sL https://github.com/fenixsoft/fenix-cli/releases | grep -o 'releases/download/v[0-9]*.[0-9]*.[0-9]*/' | sort --version-sort | tail -1 | awk -F'/' '{ print $3}')"
NAME="Fenix-CLI $VERSION"
URL="https://github.com/fenixsoft/fenix-cli/releases/download/${VERSION}/fenix-cli"

printf "\nDownloading %s from %s ..." "$NAME" "$URL"
if ! curl -o /dev/null -sIf "$URL"; then
  printf "\n%s is not found, please specify a valid VERSION\n" "$URL"
  exit 1
fi
curl -fsLO "$URL"
chmod +x fenix-cli
mv fenix-cli /usr/bin

printf ""
printf "\nFenix-CLI %s Download Complete!\n" "$VERSION"
printf "%s has been successfully downloaded on your system.\n" "$NAME"
printf "Need more information? Visit https://github.com/fenixsoft/fenix-cli \n"