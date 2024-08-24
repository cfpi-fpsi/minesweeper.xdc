#!/usr/bin/env bash

name="Application"
EXCLUDE_FILES="webxdc.js LICENSE README README.md *.sh *.xdc *~"

function usage() {
  echo "Usage: ${0} [-hgp]"
  echo "  -h   Display this message"
  echo "  -f   Lint and format all source files"
  echo "  -g   Add pre-commit hook which formats and lints code"
  echo "  -p   Optimize all files and pack the project as a WebXDC"
  exit 0
}

function add_pre_commit_hook() {
  echo "Not implemented."
  :
}

function lint_and_format() {
  if [[ -x "$(command -v rslint)" ]]; then
    echo "Linting JavaScript source files."
    find . -iname "*.js" -exec rslint -f {} \;
  else
    echo "rslint not found. Cannot lint source."
    return -1
  fi

  if [[ -x "$(command -v js-beautify)" ]]; then
    echo "Formatting JavaScript source files."
    find . -iname "*.js" -exec js-beautify -r {} \;
  else
    echo "js-beautify not found. Cannot format source."
    return -1
  fi

}

# $1 - filename
function extract_toml() {
  while IFS='= ' read -r lhs rhs; do
    if [[ ! $lhs =~ ^\ *# && -n $lhs ]]; then
      rhs="${rhs%%\#*}"
      rhs="${rhs%%*( )}"
      rhs="${rhs%\"*}"
      rhs="${rhs#\"*}"
      declare -g $lhs="$rhs"
    fi
  done <$1
}

function webxdc_create() {
  [[ ! -f ./index.html ]] && echo "Webxdc requires it's apps to have AT LEAST an index.html. Aborting." && exit -1

  mkdir temp

  if [[ -x "$(command -v minify)" ]]; then
    echo "Minifying all source files."
    cp --parents -r *.html *.css *.js temp/
    minify -r *.html *.js *.css -o ./
  else
    echo "minify command not found. Proceeding without minifying source code."
  fi

  if [[ -x "$(command -v jpegoptim)" ]]; then
    echo "Loslessly optimizing all JPEG files."
    # TODO: perhaps do this like minifying, as not to replace the
    # original images?
    find . \( -iname "*.jpg" -or -iname "*.jpeg" \) -exec jpegoptim -f --strip-all {} \;
  else
    echo "jpegoptim not found. Not optimizing any JPEG files."
  fi

  if [[ -x "$(command -v optipng)" ]]; then
    echo "Loslessly optimizing all PNG files."
    find . -iname "*.png" -exec optipng -strip all {} \;
  else
    echo "optipng not found. Not optimizing any PNG files."
  fi

  echo "Removing all existing xdc packages."
  rm -f *.xdc

  if [[ -f ./manifest.toml ]]; then
    echo "Extracting name from manifest.toml."
    extract_toml manifest.toml
  else
    echo "No manifest.toml found. Using default application name."
  fi

  if [[ -x "$(command -v zip)" ]]; then
    echo "Packing project into an xdc package."
    zip -9 --recurse-paths "${name}.xdc" --exclude $EXCLUDE_FILES -- * >/dev/null
    echo "Output: ${name}.xdc."
    mv temp/* .
    rmdir temp
  else
    echo "The program zip could not be found. It is required to pack Webxdc applications. Aborting."
    exit -1
    mv temp/* .
    rmdir temp
  fi
}

[[ "$#" -eq 0 ]] && usage
while getopts ":hgpf" option; do
  case ${option} in
  h)
    usage
    ;;
  f)
    lint_and_format
    ;;
  g)
    add_pre_commit_hook
    ;;
  p)
    webxdc_create
    ;;
  \?)
    echo "Invalid option -${OPTARG}"
    usage
    ;;
  esac
done
