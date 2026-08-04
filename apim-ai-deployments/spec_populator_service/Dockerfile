# -------------------------------------------------------------------------------------
#
# Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
#
# This software is the property of WSO2 LLC. and its suppliers, if any.
# Dissemination of any information or reproduction of any material contained
# herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
# You may not alter or remove any copyright or other notice from copies of this content.
#
# --------------------------------------------------------------------------------------
FROM FROM ubuntu:20.04 AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3.9=3.9.5-3ubuntu0~20.04.1 \
      python3-pip \
      python3.9-venv=3.9.5-3ubuntu0~20.04.1 && \
    apt-get install -y g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    python3.9 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /tmp
COPY requirements.txt .
RUN pip3 install --upgrade pip && \
    pip3 --no-cache-dir install --upgrade wheel && \
    pip3 --no-cache-dir install --upgrade setuptools && \
    pip3 --no-cache-dir install -r requirements.txt  
    # building wheel for modules fail if wheel is not
    # already installed. Hence the reason to execute a separate pip3
    # install for wheel before installing requirements


FROM FROM ubuntu:20.04

ARG GROUP=ai
ARG USER=python-ai
ARG USER_ID=10500
ARG USER_GROUP_ID=10500

RUN groupadd --system --gid ${USER_GROUP_ID} ${GROUP} && \
    useradd --system --create-home --home-dir /home/${USER} --no-log-init --gid ${USER_GROUP_ID} --uid ${USER_ID} ${USER} && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      python3.9=3.9.5-3ubuntu0~20.04.1 \
      python3-pip \
      python3.9-venv=3.9.5-3ubuntu0~20.04.1 \
      libncurses6=6.2-0ubuntu2.1 \
      libncursesw6=6.2-0ubuntu2.1 \
      libtinfo6=6.2-0ubuntu2.1 \
      ncurses-base=6.2-0ubuntu2.1 \
      ncurses-bin=6.2-0ubuntu2.1 \
      perl-base=5.30.0-9ubuntu0.5 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /home/${USER}/spec_populator_service

COPY --from=builder --chown=${USER}:${GROUP} /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# sources
COPY --chown=${USER}:${GROUP} / spec_populator_service/

WORKDIR /home/${USER}/spec_populator_service/spec_populator_service

USER ${USER}

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
