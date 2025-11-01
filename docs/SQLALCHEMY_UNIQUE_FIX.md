# SQLAlchemy Unique() 方法问题及解决方案

## 问题描述

在使用 SQLAlchemy 2.0 时，当查询涉及到 **joined eager loading（联结式预加载）** 的集合关系时，必须对查询结果调用 `.unique()` 方法，否则会抛出以下错误：

```
sqlalchemy.exc.InvalidRequestError: The unique() method must be invoked on this Result, 
as it contains results that include joined eager loads against collections
```

## 问题原因

### 1. Joined Eager Loading 的工作原理

当使用 `lazy="joined"` 或 `joinedload()` 时，SQLAlchemy 会使用 SQL JOIN 来预加载关联对象。这会导致：

- 主对象的每一行都会与关联对象的每一行进行笛卡尔积组合
- 结果集中会包含重复的主对象行
- 例如：一个 Role 有 3 个 Permission，查询会返回 3 行相同的 Role

### 2. 为什么需要 unique()

SQLAlchemy 2.0 要求显式调用 `.unique()` 来：
- 去除重复的主对象
- 正确组装关联对象集合
- 避免数据不一致

## 项目中的具体案例

### 问题代码位置

`src/features/admin/models.py` 中的 Role 模型：

```python
class Role(Base, AuditTimeMixin):
    __tablename__ = "role"
    id: Mapped[types.int_pk]
    name: Mapped[str]
    slug: Mapped[str]
    description: Mapped[str | None]
    
    # 这里使用了 lazy="joined"，会导致问题
    permission: Mapped[list["Permission"]] = relationship(
        secondary="role_permission", 
        back_populates="role", 
        lazy="joined"  # ← 问题根源
    )
    
    menu: Mapped[list["Menu"]] = relationship(
        secondary="role_menu", 
        back_populates="role", 
        lazy="joined"  # ← 问题根源
    )
```

### 错误触发场景

当调用 `role_repo.list_and_count()` 时：

```python
# src/features/admin/api.py
@router.get("/roles")
async def get_roles(self, query: Annotated[schemas.RoleQuery, Depends()]) -> ListT[schemas.RoleList]:
    count, results = await role_repo.list_and_count(self.session, query)
    # ↑ 这里会触发错误，因为 Role 有 lazy="joined" 的关系
    return ListT(count=count, results=[schemas.RoleList.model_validate(r) for r in results])
```

## 解决方案

### 修改位置

`src/core/repositories/repository.py` 中的查询方法

### 修改内容

在所有可能返回带有 joined eager loads 的查询中添加 `.unique()` 调用：

#### 1. list_and_count 方法

```python
async def list_and_count(
    self, 
    session: AsyncSession, 
    query: QueryParams, 
    *options: ExecutableOption, 
    undefer_load: bool = True
) -> tuple[int, Sequence[ModelT]]:
    stmt = self._get_base_stmt()
    stmt = self._apply_list(stmt, query)
    if query.q:
        stmt = self._apply_search(stmt, query.q)
    c_stmt = stmt.with_only_columns(func.count()).order_by(None)
    if query.limit is not None and query.offset is not None:
        stmt = self._apply_pagination(stmt, query.limit, query.offset)
    if query.order_by and query.order:
        stmt = self._apply_order_by(stmt, query.order_by, query.order)
    stmt = self._apply_selectinload(stmt, *options, undefer_load=undefer_load)
    _count = await session.scalar(c_stmt)
    
    # 修复：添加 .unique() 调用
    results = (await session.scalars(stmt)).unique().all()  # ← 关键修改
    
    return _count if _count is not None else 0, results
```

#### 2. get_all 方法

```python
async def get_all(self, session: AsyncSession) -> Sequence[ModelT]:
    # 修复：添加 .unique() 调用
    return (await session.scalars(self._get_base_stmt())).unique().all()  # ← 关键修改
```

#### 3. get_multi_by_cursor 方法

```python
async def get_multi_by_cursor(
    self,
    session: AsyncSession,
    filters: list[BinaryExpression[bool]] | None = None,
    *options: ExecutableOption,
    undefer_load: bool = False,
) -> Sequence[ModelT]:
    stmt = self._get_base_stmt()
    stmt = self._apply_filter(stmt=stmt, filters=filters)
    stmt = self._apply_selectinload(stmt, *options, undefer_load=undefer_load)
    
    # 修复：添加 .unique() 调用
    return (await session.scalars(stmt)).unique().all()  # ← 关键修改
```

#### 4. get_multi_by_ids 方法

```python
async def get_multi_by_ids(
    self, 
    session: AsyncSession, 
    pk_ids: list[PkIdT], 
    *options: ExecutableOption, 
    undefer_load: bool = False
) -> Sequence[ModelT]:
    stmt = self._get_base_stmt()
    id_str = self.get_id_attribute_value(self.model)
    stmt = stmt.where(id_str.in_(pk_ids))
    if options:
        stmt = self._apply_selectinload(stmt, *options, undefer_load=undefer_load)
    
    # 修复：添加 .unique() 调用
    return (await session.scalars(stmt)).unique().all()  # ← 关键修改
```

## 技术细节

### unique() 方法的作用

1. **去重主对象**：根据主键去除重复的主对象实例
2. **保留关联集合**：保持所有预加载的关联对象
3. **正确的对象图**：构建正确的对象关系图

### 示例说明

假设有以下数据：
- Role(id=1, name="Admin") 有 3 个 Permission
- 使用 `lazy="joined"` 查询

**不使用 unique() 的结果：**
```python
[
    Role(id=1, name="Admin", permissions=[Permission(id=1)]),
    Role(id=1, name="Admin", permissions=[Permission(id=2)]),
    Role(id=1, name="Admin", permissions=[Permission(id=3)])
]
# 返回 3 个 Role 对象（重复）
```

**使用 unique() 的结果：**
```python
[
    Role(id=1, name="Admin", permissions=[
        Permission(id=1),
        Permission(id=2),
        Permission(id=3)
    ])
]
# 返回 1 个 Role 对象，包含所有 3 个 Permission
```

## 性能考虑

### unique() 的性能影响

- **内存开销**：需要在内存中进行去重操作
- **CPU 开销**：需要比较主键和合并对象
- **影响很小**：对于大多数应用场景，性能影响可以忽略

### 替代方案

如果担心性能，可以考虑：

1. **改用 selectinload**（推荐）：
```python
permission: Mapped[list["Permission"]] = relationship(
    secondary="role_permission", 
    back_populates="role", 
    lazy="selectin"  # 使用 SELECT IN 查询，不需要 unique()
)
```

2. **改用 lazy load**：
```python
permission: Mapped[list["Permission"]] = relationship(
    secondary="role_permission", 
    back_populates="role", 
    lazy="select"  # 延迟加载，访问时才查询
)
```

3. **手动指定 joinedload**：
```python
# 只在需要时使用 joinedload
stmt = select(Role).options(joinedload(Role.permission))
results = (await session.execute(stmt)).unique().scalars().all()
```

## 最佳实践

### 1. 默认使用 selectinload

对于集合关系，推荐使用 `lazy="selectin"`：

```python
# 推荐做法
permission: Mapped[list["Permission"]] = relationship(
    secondary="role_permission", 
    back_populates="role", 
    lazy="selectin"  # 更好的性能，不需要 unique()
)
```

### 2. 在 Repository 层统一处理

在 Repository 的所有查询方法中统一添加 `.unique()`，确保：
- 代码一致性
- 避免遗漏
- 容错性更强

### 3. 显式声明 unique()

即使某些查询可能不需要，也建议统一添加 `.unique()`：
- 提高代码可维护性
- 避免未来修改模型时出错
- 性能影响微乎其微

## 相关资源

- [SQLAlchemy 2.0 Migration Guide](https://docs.sqlalchemy.org/en/20/changelog/migration_20.html#change-4710)
- [ORM Querying Guide - unique()](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html#joined-eager-loading)
- [Relationship Loading Techniques](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html)

## 总结

### 问题本质
SQLAlchemy 2.0 在使用 joined eager loading 时要求显式调用 `.unique()` 来正确处理结果集中的重复行。

### 解决方案
在所有可能返回带有 joined loads 的查询方法中添加 `.unique()` 调用。

### 推荐做法
- 对于集合关系，优先使用 `lazy="selectin"` 而非 `lazy="joined"`
- 在 Repository 层统一处理 `.unique()` 调用
- 保持代码一致性和可维护性

---

**修改日期**: 2025年11月1日  
**修改文件**: `src/core/repositories/repository.py`  
**影响范围**: 所有使用 joined eager loading 的模型查询
