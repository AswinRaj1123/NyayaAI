from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ✅ IMPORT BASE & DATABASE URL
from src.models import Base
from src.database import SQLALCHEMY_DATABASE_URL

# Alembic Config object
config = context.config

# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ✅ Target metadata (ONLY upload-service models)
target_metadata = Base.metadata


# 🔒 VERY IMPORTANT:
# Only allow Alembic to manage upload-service tables
def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        return name == "documents"  # 👈 ONLY THIS SERVICE'S TABLE
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=SQLALCHEMY_DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version_upload",  # ✅ unique version table
        include_object=include_object,           # ✅ CRITICAL SAFETY
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = SQLALCHEMY_DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table="alembic_version_upload",  # ✅ unique version table
            include_object=include_object,           # ✅ CRITICAL SAFETY
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()