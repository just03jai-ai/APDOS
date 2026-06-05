# syntax=docker/dockerfile:1.7

ARG UV_IMAGE=ghcr.io/astral-sh/uv:0.11.3
ARG PYTHON_IMAGE=python:3.14-slim-bookworm

FROM ${UV_IMAGE} AS uv
FROM ${PYTHON_IMAGE} AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy \
    APP_HOME=/app \
    APP_ENV=prod

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates; \
    rm -rf /var/lib/apt/lists/*

COPY --from=uv /uv /uvx /bin/

WORKDIR ${APP_HOME}

COPY pyproject.toml uv.lock* README.md* ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable --no-install-project

COPY . .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable

RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appgroup ${APP_HOME}

ENV PATH="${APP_HOME}/.venv/bin:${PATH}"

EXPOSE 8000

USER appuser

CMD ["python", "app.py"]
