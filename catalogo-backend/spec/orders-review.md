# Review: orders (+ order_items)

## Estado: ✅ APROBADO

## Resumen

| Aspecto | Resultado |
|---------|-----------|
| Implementación según spec | ✅ Coincidencia exacta en todos los archivos |
| Tests | ✅ 13/13 pasaron |
| `manage.py check` | ✅ Sin errores |
| Migraciones | ✅ Aplicadas (dependencia entre apps resuelta) |

## Verificación detallada

### Modelos

| Archivo | Aspecto | Resultado |
|---------|---------|-----------|
| `apps/order_items/models.py` | `OrderItem.order` FK → `Order` (CASCADE, related_name='items') | ✅ Igual spec |
| `apps/order_items/models.py` | `OrderItem.plushie` FK → `Plushie` (PROTECT, related_name='order_items') | ✅ Igual spec |
| `apps/order_items/models.py` | `quantity` PositiveIntegerField, `unit_price` DecimalField(10,2) | ✅ Igual spec |
| `apps/order_items/models.py` | `Meta.verbose_name_plural = 'order items'` | ✅ Igual spec |
| `apps/order_items/models.py` | `__str__` method | ✅ Igual spec |
| `apps/orders/models.py` | `OrderStatus` TextChoices (4 values) | ✅ Igual spec |
| `apps/orders/models.py` | `Order` campos: customer_name, email, phone, observations, status, created_at, updated_at | ✅ Igual spec + db-schema |
| `apps/orders/models.py` | `observations` blank=True, null=True | ✅ Igual spec |
| `apps/orders/models.py` | `Meta.ordering = ['-created_at']`, `verbose_name_plural = 'orders'` | ✅ Igual spec |
| `apps/orders/models.py` | `can_transition_to()` — transiciones válidas y terminal states | ✅ Igual spec |

### Serializers

| Archivo | Aspecto | Resultado |
|---------|---------|-----------|
| `apps/order_items/serializers.py` | `OrderItemSerializer` con `plushie_id` write_only | ✅ Igual spec |
| `apps/order_items/serializers.py` | `plushie_name` read_only (source='plushie.name') | ✅ Igual spec |
| `apps/order_items/serializers.py` | `unit_price` read_only (DecimalField) | ✅ Igual spec |
| `apps/order_items/serializers.py` | `fields` = [id, plushie_id, plushie_name, quantity, unit_price] | ✅ Igual spec |
| `apps/orders/serializers.py` | `OrderCreateSerializer` con items anidados (many=True) | ✅ Igual spec |
| `apps/orders/serializers.py` | `read_only_fields = [id, status, created_at]` | ✅ Igual spec |
| `apps/orders/serializers.py` | `validate_items()` valida: items vacíos, plushie activo, stock, cantidad | ✅ Igual spec |
| `apps/orders/serializers.py` | `create()` congela `unit_price = plushie.price` | ✅ Igual spec |
| `apps/orders/serializers.py` | `OrderAdminListSerializer` — lista sin items | ✅ Igual spec |
| `apps/orders/serializers.py` | `OrderAdminDetailSerializer` — detalle con items | ✅ Igual spec |
| `apps/orders/serializers.py` | `OrderStatusUpdateSerializer` — solo status con validación transiciones | ✅ Igual spec |

### Views

| Archivo | Aspecto | Resultado |
|---------|---------|-----------|
| `apps/orders/views.py` | `OrderCreateView` — CreateAPIView, AllowAny | ✅ Igual spec |
| `apps/orders/views.py` | `OrderAdminViewSet` — ReadOnlyModelViewSet, IsAuthenticated | ✅ Igual spec |
| `apps/orders/views.py` | `get_serializer_class()` — retrieve → Detail, partial_update → StatusUpdate, default → List | ✅ Igual spec |
| `apps/orders/views.py` | `partial_update()` manual — save + return full detail | ✅ Igual spec |

### URLs

| Archivo | Aspecto | Resultado |
|---------|---------|-----------|
| `apps/order_items/urls.py` | Vacío (sin endpoints propios) | ✅ Igual spec |
| `apps/orders/urls.py` | `path('orders/', OrderCreateView.as_view())` | ✅ Igual spec |
| `apps/orders/urls.py` | `DefaultRouter` registra `r'admin/orders'` | ✅ Igual spec |
| `apps/orders/urls.py` | Ambos combinados con `urlpatterns += admin_router.urls` | ✅ Igual spec |
| `config/urls.py` | `path('api/', include('apps.orders.urls'))` | ✅ Igual spec |

### Admin

| Archivo | Aspecto | Resultado |
|---------|---------|-----------|
| `apps/order_items/admin.py` | `@admin.register(OrderItem)` + list_display + list_filter | ✅ Igual spec |
| `apps/orders/admin.py` | `@admin.register(Order)` + list_display + list_filter + search_fields + readonly_fields | ✅ Igual spec |

### Tests (13/13 pasaron)

| Test | Resultado |
|------|-----------|
| `test_create_order_without_token` — POST público sin token → 201 | ✅ |
| `test_create_order_returns_items_with_frozen_price` — unit_price = precio al crear | ✅ |
| `test_create_order_with_inactive_plushie_fails` — plushie inactivo → 400 | ✅ |
| `test_create_order_with_insufficient_stock_fails` — stock insuficiente → 400 | ✅ |
| `test_create_order_without_items_fails` — items vacíos → 400 | ✅ |
| `test_create_order_default_status_is_pending` — status por defecto = 'pending' | ✅ |
| `test_admin_list_orders_without_token_fails` — GET admin sin token → 401 | ✅ |
| `test_admin_list_orders_with_token_succeeds` — GET admin con token → 200 | ✅ |
| `test_admin_detail_orders_with_items` — GET detail incluye items | ✅ |
| `test_valid_status_transition_pending_to_contacted` — transición válida → 200 | ✅ |
| `test_invalid_status_transition_pending_to_closed` — transición inválida → 400 | ✅ |
| `test_invalid_status_transition_closed_to_pending` — terminal state → 400 | ✅ |
| `test_frozen_price_does_not_update` — precio congelado no cambia tras modificar Plushie.price | ✅ |

## Conclusión

**Todos los archivos implementados coinciden exactamente con la spec.** No se encontraron errores. Los 13 tests pasan correctamente. El módulo cumple con architecture.md, db-schema.md, y la spec `orders.md`.

✅ **APROBADO** — El módulo `orders` (+ `order_items`) está listo para producción.
