# Appium 3 + UiAutomator2 — dipakai service `appium` di docker-compose.
# Device/emulator tetap di host; Appium connect via host.docker.internal:ADB_PORT
FROM node:22-bookworm-slim

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    android-tools-adb \
    ca-certificates \
    curl \
    socat \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

RUN npm install -g appium@3.1.0 \
  && appium driver install uiautomator2@4.2.3

# android-tools-adb menyediakan /usr/lib/android-sdk/platform-tools/adb
ENV ANDROID_HOME=/usr/lib/android-sdk \
    ANDROID_SDK_ROOT=/usr/lib/android-sdk \
    PATH="/usr/lib/android-sdk/platform-tools:${PATH}" \
    APPIUM_HOME=/root/.appium \
    ADB_CONNECT_TARGETS=host.docker.internal:5555

COPY entrypoint.sh /entrypoint.sh
# Strip CRLF (Windows checkout) so shebang resolves to /bin/sh, not /bin/sh\r
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 4723

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=8 \
  CMD curl -fsS "http://127.0.0.1:4723/status" >/dev/null || exit 1

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
