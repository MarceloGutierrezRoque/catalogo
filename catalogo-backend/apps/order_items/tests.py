from django.test import TestCase
from apps.plushies.models import Plushie
from apps.orders.models import Order
from apps.order_items.models import OrderItem


class OrderItemModelTests(TestCase):
    """Tests for OrderItem model."""

    def setUp(self):
        self.plushie = Plushie.objects.create(
            name='Osito', price=25.00, stock=10,
            is_active=True, is_deleted=False,
        )
        self.order = Order.objects.create(
            customer_name='Juan', customer_email='j@t.com',
            customer_phone='555',
        )
        self.item = OrderItem.objects.create(
            order=self.order,
            plushie=self.plushie,
            quantity=2,
            unit_price=25.00,
        )

    def test_str_returns_description(self):
        """__str__() debe devolver '2x Osito @ 25.00'."""
        expected = '2x Osito @ 25.0'
        self.assertEqual(str(self.item), expected)


class OrderItemSerializerTests(TestCase):
    """Tests for OrderItemSerializer creation and validation."""

    def setUp(self):
        self.plushie = Plushie.objects.create(
            name='Test', price=15.00, stock=5,
            is_active=True, is_deleted=False,
        )

    def test_order_item_serializer_fields(self):
        """Serializer debe tener los campos esperados."""
        from apps.order_items.serializers import OrderItemSerializer
        serializer = OrderItemSerializer()
        expected_fields = {'id', 'plushie_id', 'plushie_name', 'quantity', 'unit_price'}
        self.assertEqual(set(serializer.fields.keys()), expected_fields)

    def test_plushie_id_is_write_only(self):
        """plushie_id debe ser write_only."""
        from apps.order_items.serializers import OrderItemSerializer
        serializer = OrderItemSerializer()
        self.assertTrue(serializer.fields['plushie_id'].write_only)

    def test_unit_price_is_read_only(self):
        """unit_price debe ser read_only."""
        from apps.order_items.serializers import OrderItemSerializer
        serializer = OrderItemSerializer()
        self.assertTrue(serializer.fields['unit_price'].read_only)
