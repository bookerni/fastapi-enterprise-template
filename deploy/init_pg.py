import asyncio

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database.session import async_session
from src.features.admin.consts import ReservedRoleSlug
from src.features.admin.models import Group, Role, User
from src.features.admin.security import get_password_hash


async def create_pg_extensions(session: AsyncSession) -> None:
    await session.execute(text('create EXTENSION if not EXISTS "pgcrypto"'))
    await session.execute(text('create EXTENSION if not EXISTS "hstore"'))
    await session.commit()


async def create_init_user(session: AsyncSession) -> None:
    # Check if admin role exists, if not create it
    admin_role_result = await session.execute(
        select(Role).where(Role.slug == ReservedRoleSlug.ADMIN)
    )
    admin_role = admin_role_result.scalars().first()
    if not admin_role:
        admin_role = Role(name="Administrator", slug=ReservedRoleSlug.ADMIN, description="App system admin")
        session.add(admin_role)
        await session.commit()
    
    # Check if admin user exists
    admin_user_result = await session.execute(
        select(User).where(User.email == "admin@system.com")
    )
    admin_user = admin_user_result.scalars().first()
    
    if admin_user:
        # User exists, update password
        admin_user.password = get_password_hash("admin")
        session.add(admin_user)
        await session.commit()
        print("✓ Admin user already exists, password updated successfully")
    else:
        # Create new group and user
        admin_group = Group(
            name="System Administrator",
            description="App systemic administrators group",
            role_id=admin_role.id,
            user=[
                User(
                    name="Administrator",
                    email="admin@system.com",
                    password=get_password_hash("admin"),
                    role_id=admin_role.id,
                )
            ],
        )
        session.add(admin_group)
        await session.commit()
        print("✓ Admin user created successfully")


async def init_app() -> None:
    async with async_session() as session:
        await create_pg_extensions(session)
        await create_init_user(session)


if __name__ == "__main__":
    asyncio.run(init_app())
