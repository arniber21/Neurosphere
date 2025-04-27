FROM ubuntu:22.04

# Install base dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    gpg \
    build-essential \
    vim \
    xdotool \
    libxdo-dev \
    xinit \
    xorg \
    xserver-xorg-core \
    xserver-xorg-video-dummy \
    xauth \
    x11-apps \
    libxtst6

# Add Ultraleap repository
RUN wget -qO - https://repo.ultraleap.com/keys/apt/gpg | gpg --dearmor > /etc/apt/trusted.gpg.d/ultraleap.gpg && \
    echo 'deb [arch=amd64] https://repo.ultraleap.com/apt stable main' > /etc/apt/sources.list.d/ultraleap.list && \
    apt-get update && \
    apt-get install -y \
    ultraleap-hand-tracking \
    ultraleap-hand-tracking-service \
    ultraleap-hand-tracking-control-panel

# Clone and build leapMiceGemini
RUN git clone https://github.com/SuckDuck/leapMiceGemini.git /usr/local/src/leapMiceGemini && \
    cd /usr/local/src/leapMiceGemini && \
    make install

# Configure X11 environment
ENV DISPLAY=host.docker.internal:0
ENV XAUTHORITY=/root/.Xauthority

# Set up persistent bash history
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" && \
    mkdir /commandhistory && \
    touch /commandhistory/.bash_history && \
    echo "$SNIPPET" >> /root/.bashrc

# Leap Motion service setup
RUN systemctl enable ultraleap-hand-tracking-service

WORKDIR /usr/local/src/leapMiceGemini

CMD ["/bin/bash"]

