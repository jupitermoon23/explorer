#!/usr/bin/env bash
#
# Copyright (C) 2021 diva.exchange
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
# Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
#

# -e  Exit immediately if a simple command exits with a non-zero status
set -e

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"/../
cd ${PROJECT_PATH}
PROJECT_PATH=`pwd`/

source "${PROJECT_PATH}bin/echos.sh"
source "${PROJECT_PATH}bin/helpers.sh"

if ! command_exists docker; then
  error "docker not available. Please install it first.";
  exit 1
fi

TAG=$(<${PROJECT_PATH}/static/version)
info "Building docker image divax/explorer:${TAG}..."
sudo docker build --force-rm --pull --no-cache -f ${PROJECT_PATH}Dockerfile -t divax/explorer:${TAG} .

TAG=current
info "Building docker image divax/explorer:${TAG}..."
sudo docker build --force-rm --pull --no-cache -f ${PROJECT_PATH}Dockerfile -t divax/explorer:${TAG} .
