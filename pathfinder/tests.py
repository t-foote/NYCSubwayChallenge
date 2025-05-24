import unittest
from utils import (
    Transfer,
    format_station_id,
    ServiceType,
    MtaTrip,
    RealtimeMtaTrip,
    Segment,
    Session,
    get_all_trips_today,
    get_todays_service_type,
)
from datetime import datetime

class TestDatabaseFunctions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create a test session
        cls.session = Session()
        # Skip database tests if Supabase is not configured
        cls.skip_db_tests = cls.session.supabase is None
        if cls.skip_db_tests:
            print("Skipping database tests - Supabase not configured")

    def test_session_initialization(self):
        """Test that Session initializes correctly with stop mappings."""
        session = Session()
        self.assertIsNotNone(session.supabase)
        self.assertIsInstance(session.stop_pk_to_nyct_id, dict)
        self.assertIsInstance(session.nyct_id_to_stop_pk, dict)
        self.assertTrue(len(session.stop_pk_to_nyct_id) > 0)
        self.assertTrue(len(session.nyct_id_to_stop_pk) > 0)

    def test_id_conversion_methods(self):
        """Test all ID conversion methods in Session class."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        # Get real IDs from the database for testing
        response = self.session.supabase.table('stops').select('id,nyct_stop_id').limit(1).execute()
        if not response.data:
            self.skipTest("No stops found in database")
        stop = response.data[0]
        stop_pk = stop['id']
        stop_nyct_id = stop['nyct_stop_id']

        # Test stop ID conversions
        self.assertEqual(self.session.get_stop_id(stop_pk), stop_nyct_id)
        self.assertEqual(self.session.get_stop_pk(stop_nyct_id), stop_pk)
        self.assertIsNone(self.session.get_stop_id(999999))
        self.assertIsNone(self.session.get_stop_pk("999"))

        # Get real route IDs
        response = self.session.supabase.table('routes').select('id,route_id').limit(1).execute()
        if response.data:
            route = response.data[0]
            route_pk = route['id']
            route_nyct_id = route['route_id']

            # Test route ID conversions
            self.assertEqual(self.session.get_route_id(route_pk), route_nyct_id)
            self.assertEqual(self.session.get_route_pk(route_nyct_id), route_pk)
            self.assertIsNone(self.session.get_route_id(999999))
            self.assertIsNone(self.session.get_route_pk("999"))

        # Get real trip IDs
        response = self.session.supabase.table('trips_scheduled').select('id,nyct_trip_id').limit(1).execute()
        if response.data:
            trip = response.data[0]
            trip_pk = trip['id']
            trip_nyct_id = trip['nyct_trip_id']

            # Test trip ID conversions
            self.assertEqual(self.session.get_trip_id(trip_pk), trip_nyct_id)
            self.assertEqual(self.session.get_trip_pk(trip_nyct_id), trip_pk)
            self.assertIsNone(self.session.get_trip_id(999999))
            self.assertIsNone(self.session.get_trip_pk("999"))

        # Get real shape IDs
        response = self.session.supabase.table('shapes').select('id,shape_id').limit(1).execute()
        if response.data:
            shape = response.data[0]
            shape_pk = shape['id']
            shape_nyct_id = shape['shape_id']

            # Test shape ID conversions
            self.assertEqual(self.session.get_shape_id(shape_pk), shape_nyct_id)
            self.assertEqual(self.session.get_shape_pk(shape_nyct_id), shape_pk)
            self.assertIsNone(self.session.get_shape_id(999999))
            self.assertIsNone(self.session.get_shape_pk("999"))

    def test_id_conversion_consistency(self):
        """Test that ID conversions are consistent in both directions."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        # Test stop ID consistency
        for pk, nyct_id in self.session.stop_pk_to_nyct_id.items():
            self.assertEqual(self.session.get_stop_pk(nyct_id), pk)
            self.assertEqual(self.session.get_stop_id(pk), nyct_id)

        # Test route ID consistency
        for pk, nyct_id in self.session.route_pk_to_nyct_id.items():
            self.assertEqual(self.session.get_route_pk(nyct_id), pk)
            self.assertEqual(self.session.get_route_id(pk), nyct_id)

        # Test trip ID consistency
        for pk, nyct_id in self.session.trip_pk_to_nyct_id.items():
            self.assertEqual(self.session.get_trip_pk(nyct_id), pk)
            self.assertEqual(self.session.get_trip_id(pk), nyct_id)

        # Test shape ID consistency
        for pk, nyct_id in self.session.shape_pk_to_nyct_id.items():
            self.assertEqual(self.session.get_shape_pk(nyct_id), pk)
            self.assertEqual(self.session.get_shape_id(pk), nyct_id)

    def test_id_conversion_error_handling(self):
        """Test error handling for invalid IDs."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        # Test invalid stop IDs
        self.assertIsNone(self.session.get_stop_id(None))
        self.assertIsNone(self.session.get_stop_pk(None))
        self.assertIsNone(self.session.get_stop_id("not_an_int"))
        self.assertIsNone(self.session.get_stop_pk(123))  # int instead of str

        # Test invalid route IDs
        self.assertIsNone(self.session.get_route_id(None))
        self.assertIsNone(self.session.get_route_pk(None))
        self.assertIsNone(self.session.get_route_id("not_an_int"))
        self.assertIsNone(self.session.get_route_pk(123))

        # Test invalid trip IDs
        self.assertIsNone(self.session.get_trip_id(None))
        self.assertIsNone(self.session.get_trip_pk(None))
        self.assertIsNone(self.session.get_trip_id("not_an_int"))
        self.assertIsNone(self.session.get_trip_pk(123))

        # Test invalid shape IDs
        self.assertIsNone(self.session.get_shape_id(None))
        self.assertIsNone(self.session.get_shape_pk(None))
        self.assertIsNone(self.session.get_shape_id("not_an_int"))
        self.assertIsNone(self.session.get_shape_pk(123))

    def test_get_all_transfers(self):
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")
            
        transfers = self.session.get_all_transfers_from_db_static_table()
        self.assertIsInstance(transfers, list)
        if transfers:  # If we have any transfers
            transfer = transfers[0]
            self.assertIsInstance(transfer, Transfer)
            self.assertIsInstance(transfer.start_stop_id, str)
            self.assertIsInstance(transfer.end_stop_id, str)
            self.assertIsInstance(transfer.transfer_time_min, int)
            self.assertIsInstance(transfer.is_walking, bool)

    def test_format_station_id(self):
        # Test valid station IDs
        self.assertEqual(format_station_id("123"), "123")
        self.assertEqual(format_station_id("123N"), "123")
        self.assertEqual(format_station_id("123S"), "123")
        
        # Test invalid station IDs
        with self.assertRaises(ValueError):
            format_station_id("12")  # Too short
        with self.assertRaises(ValueError):
            format_station_id("1234")  # Too long
        with self.assertRaises(ValueError):
            format_station_id("12A")  # Invalid format

    def test_segment_scheduled_stops(self):
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")
            
        # Create a test trip
        trip = MtaTrip(
            route_id="A",
            trip_id="test_trip_1",
            shape_id="test_shape_1",
            service_type=ServiceType.Weekday
        )
        
        # Create a test segment
        segment = Segment(
            start_stop_id="123",
            end_stop_id="456",
            mta_trip=trip
        )
        
        # Test the stops list
        stops = segment._get_scheduled_stops()
        self.assertIsInstance(stops, list)
        if stops:  # If we have any stops
            self.assertIsInstance(stops[0], str)
            self.assertTrue(all(len(stop) == 3 for stop in stops))

    def test_transfer_data_integrity(self):
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")
            
        transfers = self.session.get_all_transfers_from_db_static_table()
        if transfers:
            for transfer in transfers:
                # Test data types
                self.assertIsInstance(transfer.start_stop_id, str)
                self.assertIsInstance(transfer.end_stop_id, str)
                self.assertIsInstance(transfer.transfer_time_min, int)
                self.assertIsInstance(transfer.is_walking, bool)
                
                # Test value ranges
                self.assertGreaterEqual(transfer.transfer_time_min, 0)
                self.assertTrue(len(transfer.start_stop_id) >= 3)
                self.assertTrue(len(transfer.end_stop_id) >= 3)
                
                # Test walking transfers
                if transfer.is_walking:
                    self.assertGreaterEqual(transfer.transfer_time_min, 1)  # Walking transfers should take at least 1 minute

    def test_scheduled_stops_ordering(self):
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")
            
        # Create a test trip with known stops
        trip = MtaTrip(
            route_id="A",
            trip_id="test_trip_1",
            shape_id="test_shape_1",
            service_type=ServiceType.Weekday
        )
        
        # Test with various start/end stop combinations
        test_cases = [
            ("123", "456"),  # Normal case
            ("123", "123"),  # Same stop
            ("999", "999"),  # Non-existent stops
        ]
        
        for start, end in test_cases:
            segment = Segment(
                start_stop_id=start,
                end_stop_id=end,
                mta_trip=trip
            )
            
            stops = segment._get_scheduled_stops()
            if stops:
                # Verify stop ordering
                for i in range(len(stops) - 1):
                    self.assertLessEqual(
                        int(stops[i]),
                        int(stops[i + 1]),
                        f"Stops not in order: {stops[i]} > {stops[i + 1]}"
                    )

    def test_mta_trip_service_type(self):
        """Test MtaTrip service type functionality."""
        trip = MtaTrip(
            route_id="A",
            trip_id="test_trip_1",
            shape_id="test_shape_1",
            service_type=ServiceType.Weekday
        )
        
        # Test service type string representation
        self.assertEqual(str(trip._service_type), "Weekday")
        
        # Test is_running_today based on current day
        today = datetime.now().weekday()
        expected_running = (
            today < 5 and trip._service_type == ServiceType.Weekday or
            today == 5 and trip._service_type == ServiceType.Saturday or
            today == 6 and trip._service_type == ServiceType.Sunday
        )
        self.assertEqual(trip.is_running_today(), expected_running)

    def test_realtime_mta_trip(self):
        """Test RealtimeMtaTrip functionality."""
        # Create a mock nyct.Trip
        class MockNyctTrip:
            def __init__(self):
                self.route_id = "A"
                self.trip_id = "test_trip_1"
                self.shape_id = "test_shape_1"
                self.stop_time_updates = []
        
        nyct_trip = MockNyctTrip()
        realtime_trip = RealtimeMtaTrip(nyct_trip)
        
        # Test inheritance and attributes
        self.assertIsInstance(realtime_trip, MtaTrip)
        self.assertEqual(realtime_trip.route_id, "A")
        self.assertEqual(realtime_trip.trip_id, "test_trip_1")
        self.assertEqual(realtime_trip.shape_id, "test_shape_1")
        
        # Test is_running_today always returns True for realtime trips
        self.assertTrue(realtime_trip.is_running_today())

    def test_get_departure_time_from_stop_and_trip(self):
        """Test that get_departure_time_from_stop_and_trip returns a valid datetime."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")
        # Get real stop and trip IDs from the database for testing
        response = self.session.supabase.table('stops').select('nyct_stop_id').limit(1).execute()
        if not response.data:
            self.skipTest("No stops found in database")
        stop_id = response.data[0]['nyct_stop_id']
        response = self.session.supabase.table('trips_scheduled').select('nyct_trip_id').limit(1).execute()
        if not response.data:
            self.skipTest("No trips found in database")
        trip_id = response.data[0]['nyct_trip_id']
        # Test the function
        departure_time = self.session.get_departure_time_from_stop_and_trip(stop_id, trip_id)
        self.assertIsInstance(departure_time, datetime)

class TestDatabaseQueries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session = Session()
        cls.skip_db_tests = cls.session.supabase is None
        if cls.skip_db_tests:
            print("Skipping database tests - Supabase not configured")

    def test_get_all_transfers(self):
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")
            
        transfers = self.session.get_all_transfers_from_db_static_table()
        self.assertIsNotNone(transfers)
        self.assertIsInstance(transfers, list)
        if transfers:  # If we have any transfers
            transfer = transfers[0]
            self.assertIsInstance(transfer, Transfer)
            self.assertIsInstance(transfer.start_stop_id, str)
            self.assertIsInstance(transfer.end_stop_id, str)
            self.assertIsInstance(transfer.transfer_time_min, int)
            self.assertIsInstance(transfer.is_walking, bool)

    def test_format_station_id(self):
        self.assertEqual(format_station_id("123"), "123")
        self.assertEqual(format_station_id("123N"), "123")
        self.assertEqual(format_station_id("123S"), "123")
        with self.assertRaises(ValueError):
            format_station_id("12")
        with self.assertRaises(ValueError):
            format_station_id("1234")
        with self.assertRaises(ValueError):
            format_station_id("12A")

class TestTripRetrieval(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session = Session()
        cls.skip_db_tests = cls.session.supabase is None
        if cls.skip_db_tests:
            print("Skipping database tests - Supabase not configured")

    def test_get_all_trips_today(self):
        """Test that get_all_trips_today returns a list of MtaTrip objects."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        trips = get_all_trips_today()
        
        # Test basic return type and structure
        self.assertIsInstance(trips, list)
        self.assertTrue(all(isinstance(trip, (MtaTrip, RealtimeMtaTrip)) for trip in trips))
        
        # Test that all trips have required attributes
        for trip in trips:
            self.assertIsInstance(trip.trip_id, str)
            self.assertIsInstance(trip.shape_id, str)
            if isinstance(trip, MtaTrip) and not isinstance(trip, RealtimeMtaTrip):
                self.assertIsInstance(trip.route_id, str)
                self.assertIsInstance(trip._service_type, ServiceType)
            elif isinstance(trip, RealtimeMtaTrip):
                self.assertTrue(hasattr(trip, 'stop_time_updates'))

    def test_trip_service_type(self):
        """Test that scheduled trips have the correct service type for today."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        trips = get_all_trips_today()
        today_service_type = get_todays_service_type()
        
        # Check that all scheduled trips have today's service type
        scheduled_trips = [trip for trip in trips if isinstance(trip, MtaTrip) and not isinstance(trip, RealtimeMtaTrip)]
        for trip in scheduled_trips:
            self.assertEqual(trip._service_type, today_service_type)

    def test_no_duplicate_trips(self):
        """Test that there are no duplicate trips between realtime and scheduled."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        trips = get_all_trips_today()
        trip_ids = set()
        
        for trip in trips:
            # Test that each trip ID is unique
            self.assertNotIn(trip.trip_id, trip_ids)
            trip_ids.add(trip.trip_id)

    def test_realtime_trip_structure(self):
        """Test that realtime trips have the correct structure."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        trips = get_all_trips_today()
        realtime_trips = [trip for trip in trips if isinstance(trip, RealtimeMtaTrip)]
        
        if realtime_trips:  # If we have any realtime trips
            trip = realtime_trips[0]
            self.assertTrue(hasattr(trip, 'nyct_trip'))
            self.assertTrue(hasattr(trip, 'stop_time_updates'))
            self.assertTrue(trip.is_running_today())  # Realtime trips should always be running

    def test_scheduled_trip_structure(self):
        """Test that scheduled trips have the correct structure."""
        if self.skip_db_tests:
            self.skipTest("Supabase not configured")

        trips = get_all_trips_today()
        scheduled_trips = [trip for trip in trips if isinstance(trip, MtaTrip) and not isinstance(trip, RealtimeMtaTrip)]
        
        if scheduled_trips:  # If we have any scheduled trips
            trip = scheduled_trips[0]
            self.assertIsInstance(trip.route_id, str)
            self.assertIsInstance(trip.trip_id, str)
            self.assertIsInstance(trip.shape_id, str)
            self.assertIsInstance(trip._service_type, ServiceType)
            self.assertEqual(trip.is_running_today(), get_todays_service_type() == trip._service_type)

if __name__ == '__main__':
    unittest.main()
