import nyct_gtfs as nyct
from typing import Any, Literal
from datetime import datetime
from enum import Enum
import os
from dotenv import load_dotenv
from supabase import create_client, Client


ONE_OF_EACH_SUBWAY_API="ABGJNL1"


class ServiceType(Enum):
    Weekday = 0
    Saturday = 1
    Sunday = 2

    def __str__(self) -> str:
        return self.name

def get_todays_service_type() -> ServiceType:
    day_of_week = datetime.now().weekday()
    if day_of_week == 5:
        return ServiceType.Saturday
    if day_of_week == 6:
        return ServiceType.Sunday
    return ServiceType.Weekday


class Transfer:
    def __init__(self,
                 start_stop_id: str,
                 end_stop_id: str,
                 transfer_time_min: int,
                 is_walking: bool,
                 ) -> None:
        """ stop_id should be the MTA's formatted station id (str), not the table PK/FK """
        self.start_stop_id = start_stop_id
        self.end_stop_id = end_stop_id
        self.transfer_time_min = transfer_time_min
        self.is_walking = is_walking


    def __repr__(self) -> str:
        return f"{self.__class__.__name__}: {self.start_stop_id} -> {self.end_stop_id} ({self.transfer_time_min} min)"



class Session:
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(Session, cls).__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        # Only initialize once
        if not self._initialized:
            # Load environment variables
            load_dotenv(dotenv_path='.env')
            # Create Supabase client
            self.supabase: Client = create_client(
                os.environ['SUPABASE_URL'],
                os.environ['SUPABASE_SERVICE_ROLE_KEY'],
            )
            
            # Initialize all ID mappings {
            # Stops
            stops_data = self.supabase.table('stops').select('id,nyct_stop_id').execute().data
            self.stop_pk_to_nyct_id = {row['id']: row['nyct_stop_id'] for row in stops_data}
            self.nyct_id_to_stop_pk = {row['nyct_stop_id']: row['id'] for row in stops_data}
            
            # Routes
            routes_data = self.supabase.table('routes').select('id,route_id').execute().data
            self.route_pk_to_nyct_id = {row['id']: row['route_id'] for row in routes_data}
            self.nyct_route_id_to_route_pk = {row['route_id']: row['id'] for row in routes_data}
            
            # Trips
            trips_data = self.supabase.table('trips_scheduled').select('id,nyct_trip_id').execute().data
            self.trip_pk_to_nyct_id = {row['id']: row['nyct_trip_id'] for row in trips_data}
            self.nyct_trip_id_to_trip_pk = {row['nyct_trip_id']: row['id'] for row in trips_data}
            
            # Shapes
            shapes_data = self.supabase.table('shapes').select('id,shape_id').execute().data
            self.shape_pk_to_nyct_id = {row['id']: row['shape_id'] for row in shapes_data}
            self.nyct_shape_id_to_shape_pk = {row['shape_id']: row['id'] for row in shapes_data}
            # }

            # populate other attributes:
            response = self.supabase.table('stops').select('nyct_stop_id,stop_name').execute()
            self._stops_id_to_name = {row['nyct_stop_id']: row['stop_name'] for row in response.data}

            self._initialized = True

    def get_stop_id(self, stop_pk: int) -> str:
        """Convert a database stop PK to an MTA stop ID."""
        return self.stop_pk_to_nyct_id.get(stop_pk)

    def get_stop_pk(self, nyct_stop_id: str) -> int:
        """Convert an MTA stop ID to a database stop PK."""
        return self.nyct_id_to_stop_pk.get(nyct_stop_id)
    
    def get_route_id(self, route_pk: int) -> str:
        """Convert a database route PK to an MTA route ID."""
        return self.route_pk_to_nyct_id.get(route_pk)
    
    def get_route_pk(self, nyct_route_id: str) -> int:
        """Convert an MTA route ID to a database route PK."""
        return self.nyct_route_id_to_route_pk.get(nyct_route_id)
    
    def get_trip_id(self, trip_pk: int) -> str:
        """Convert a database trip PK to an MTA trip ID."""
        return self.trip_pk_to_nyct_id.get(trip_pk)
    
    def get_trip_pk(self, nyct_trip_id: str) -> int:
        """Convert an MTA trip ID to a database trip PK."""
        return self.nyct_trip_id_to_trip_pk.get(nyct_trip_id)
    
    def get_shape_id(self, shape_pk: int) -> str:
        """Convert a database shape PK to an MTA shape ID."""
        return self.shape_pk_to_nyct_id.get(shape_pk)
    
    def get_shape_pk(self, nyct_shape_id: str) -> int:
        """Convert an MTA shape ID to a database shape PK."""
        return self.nyct_shape_id_to_shape_pk.get(nyct_shape_id)
    
    def get_stop_name(self, nyct_stop_id: str) -> str:
        """
        Convert an MTA stop ID to its name.
        Memoized to only do one database lookup.
        """
        if not hasattr(self, '_stop_id_to_name'):
            # Load all stops into memory
            response = self.supabase.table('stops').select('nyct_stop_id,stop_name').execute()
            if hasattr(response, 'error') and response.error:
                print(f"Error fetching stop names: {response.error}")
                return None
            self._stop_id_to_name = {row['nyct_stop_id']: row['stop_name'] for row in response.data}
        return self._stop_id_to_name.get(nyct_stop_id)
    
    def get_all_transfers_from_db_static_table(self) -> list[Transfer]:
        """Get all transfers from the database. Memoized."""
        if not hasattr(self, '_all_transfers'):
            response = self.supabase.table('transfers').select('*').execute()
            if hasattr(response, 'error') and response.error:
                print(f"Error fetching transfers: {response.error}")
                return []
            self._all_transfers = []
            for row in response.data:
                # Convert database stop IDs to MTA stop IDs
                from_stop_id = self.get_stop_id(row['from_stop_id'])
                to_stop_id = self.get_stop_id(row['to_stop_id'])
                if from_stop_id and to_stop_id:
                    transfer = Transfer(
                        start_stop_id=from_stop_id,
                        end_stop_id=to_stop_id,
                        transfer_time_min=row['transfer_time_min'],
                        is_walking=row['is_walking_transfer']
                    )
                    self._all_transfers.append(transfer)
        return self._all_transfers
    
    def get_departure_time_from_stop_and_trip(self, stop_id: str, trip_id: str) -> datetime:
        """Get the departure time from a stop and a trip."""
        session = Session()
        stop_pk = session.get_stop_pk(stop_id)
        trip_pk = session.get_trip_pk(trip_id)
        
        # Check if we found valid primary keys
        if stop_pk is None:
            print(f"Warning: Could not find database PK for stop ID: {stop_id}")
            return None
        if trip_pk is None:
            print(f"Warning: Could not find database PK for trip ID: {trip_id}")
            return None
            
        response = session.supabase.table('trip_stop_times_scheduled')\
            .select('dep_time,dep_time_is_next_day')\
            .eq('stop_id', stop_pk)\
            .eq('trip_id', trip_pk)\
            .execute()
            
        if not response.data:
            print(f"Warning: No departure time found for stop {stop_id} and trip {trip_id}")
            return None
            
        time_data = response.data[0]
        # Create a datetime object for today with the time from the database
        today = datetime.now().date()
        if time_data['dep_time_is_next_day']:
            today = today.replace(day=today.day + 1)
        dep_time_obj = datetime.strptime(time_data['dep_time'], "%H:%M:%S").time()
        return datetime.combine(today, dep_time_obj)
    
    def get_all_stop_ids(self) -> list[str]:
        """Get all stops from the database."""
        return list(self._stops_id_to_name.keys())
    
    def get_stop_name(self, nyct_stop_id: str) -> str:
        """Get the name of a stop from the database."""
        try:
            return self._stops_id_to_name[nyct_stop_id]
        except KeyError:
            raise KeyError(f"Could not find stop name for {nyct_stop_id}")

    def is_valid_stop_id(self, nyct_stop_id: str) -> bool:
        """Return True if the stop id exists in the stops table."""
        return nyct_stop_id in self.nyct_id_to_stop_pk



def format_station_id(station_id: str) -> str:
    """Format a station ID to the standard format."""
    try:
        # Remove N/S suffix if present
        if station_id.endswith('S') or station_id.endswith('N'):
            station_id = station_id[:-1]
        
        # Validate format: must be exactly 3 digits
        if not (len(station_id) == 3 and station_id.isdigit()):
            print(f"Warning: Invalid station id format: {station_id}")
            return station_id  # Return original ID instead of raising error
        
        return station_id
    except Exception as e:
        print(f"Warning: Error formatting station id {station_id}: {str(e)}")
        return station_id  # Return original ID on any error



class MtaTrip:
    """ 
    Represents a 'trip' in the way the MTA would classify it.
    A scheduled train journey.
    """
    def __init__(self, 
                 route_id: str, 
                 trip_id: str, 
                 shape_id: str,
                 service_type: ServiceType,
                ) -> None:
        self.route_id = route_id
        self.trip_id = trip_id
        self.shape_id = shape_id
        self._service_type = service_type

    def is_running_today(self) -> bool:
        return get_todays_service_type() == self._service_type



class RealtimeMtaTrip(MtaTrip):
    """
    A trip that has appeared on the MTA's realtime data feed.
    Either underway or soon-to-be underway.
    """
    def __init__(self, nyct_trip: nyct.Trip) -> None:
        # Store the nyct.Trip as an attribute
        self.nyct_trip: nyct.Trip = nyct_trip
        MtaTrip.__init__(self, 
                         route_id=nyct_trip.route_id,
                         trip_id=nyct_trip.trip_id,
                         shape_id=nyct_trip.shape_id,
                         service_type=None
                        )
        # Copy any additional attributes needed from nyct_trip
        self.stop_time_updates = getattr(nyct_trip, 'stop_time_updates', [])
    
    def is_running_today(self) -> bool:
        return True



class Segment:
    """
    A user's segment of a journey, which consists of boarding 1 MTA trip from
    one stop, and disembarking at another stop.
    """
    def __init__(self,
                 start_stop_id: str,  # MTA stop ID
                 end_stop_id: str,    # MTA stop ID
                 mta_trip: MtaTrip,
                 ) -> None:
        self.start_stop_id = start_stop_id
        self.end_stop_id = end_stop_id
        self.mta_trip = mta_trip
        self.all_stops_visited: list[str]  # List of MTA stop IDs that the user will visit
        
        # Figure out self.all_stops_visited:
        if isinstance(self.mta_trip, RealtimeMtaTrip):
            # Get all stops from the trip
            all_stops = [format_station_id(stu.stop_id) for stu in self.mta_trip.stop_time_updates]
            print(f"All stops from trip: {all_stops}")
            
            # Validate that our start and end stops are in the trip
            if self.start_stop_id not in all_stops:
                raise ValueError(f"Start stop {self.start_stop_id} not found in trip")
            if self.end_stop_id not in all_stops:
                raise ValueError(f"End stop {self.end_stop_id} not found in trip")
                
            # Get the stops between start and end
            start_idx = all_stops.index(self.start_stop_id)
            end_idx = all_stops.index(self.end_stop_id)
            if start_idx > end_idx:
                raise ValueError(f"Start stop {self.start_stop_id} comes after end stop {self.end_stop_id} in trip")
                
            self.all_stops_visited = all_stops[start_idx:end_idx + 1]
        else:
            self.all_stops_visited = self._get_scheduled_stops()
            if not self.all_stops_visited:
                raise ValueError(f"Could not get scheduled stops for trip {self.mta_trip.trip_id}")

    @property
    def start_stop_name(self) -> str:
        return Session().get_stop_name(self.start_stop_id)
    
    @property
    def end_stop_name(self) -> str:
        return Session().get_stop_name(self.end_stop_id)
    
    @property
    def all_stops_visited_names(self) -> list[str]:
        session = Session()
        return [session.get_stop_name(stop_id) for stop_id in self.all_stops_visited]
        
    @property
    def is_realtime(self) -> bool:
        return isinstance(self.mta_trip, RealtimeMtaTrip)
    
    def boarding_time(self) -> datetime:
        """
        The time the user boards the train.
        """
        session = Session()
        return session.get_departure_time_from_stop_and_trip(self.start_stop_id, self.mta_trip.trip_id)
    
    def disembarking_time(self) -> datetime:
        """
        The time the user disembarks the train.
        """
        session = Session()
        return session.get_departure_time_from_stop_and_trip(self.end_stop_id, self.mta_trip.trip_id)
        
    
    def _get_scheduled_stops(self) -> list[str]:
        """Get the list of stops for a scheduled trip between start and end stops."""
        session = Session()
        try:
            # Convert MTA stop IDs to database PKs for query
            start_stop_pk = session.get_stop_pk(self.start_stop_id)
            end_stop_pk = session.get_stop_pk(self.end_stop_id)
            if not start_stop_pk or not end_stop_pk:
                print(f"Could not find database PKs for stops {self.start_stop_id} or {self.end_stop_id}")
                return []

            # Get the trip's stop sequence
            response = session.supabase.table('trip_stop_times_scheduled')\
                .select('stop_id,sequence_number')\
                .eq('trip_id', session.get_trip_pk(self.mta_trip.trip_id))\
                .order('sequence_number')\
                .execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error fetching scheduled stops: {response.error}")
                return []
            
            stops = response.data
            start_idx = next((i for i, s in enumerate(stops) if s['stop_id'] == start_stop_pk), None)
            end_idx = next((i for i, s in enumerate(stops) if s['stop_id'] == end_stop_pk), None)
            
            if start_idx is None or end_idx is None:
                print(f"Could not find start or end stop in trip {self.mta_trip.trip_id}")
                return []
            
            # Convert database stop IDs back to MTA stop IDs
            return [session.get_stop_id(s['stop_id']) for s in stops[start_idx:end_idx + 1]]
            
        except Exception as e:
            print(f"Error in _get_scheduled_stops: {e}")
            return []
        

class Journey:
    """
    A journey is a list of segments.
    """
    def __init__(self) -> None:
        self.segments: list[Segment] = []

    def add_segment(self, segment: Segment) -> None:
        self.segments.append(segment)
        
    def get_total_travel_time(self) -> int:
        """
        Get the total travel time of the journey in minutes.
        Returns None if the travel time cannot be determined.
        """
        if not self.segments:
            print("Warning: Cannot calculate travel time for empty journey")
            return None
            
        start_time = self.segments[0].boarding_time()
        if start_time is None:
            print(f"Warning: Could not determine boarding time for first segment")
            return None
            
        end_time = self.segments[-1].disembarking_time()
        if end_time is None:
            print(f"Warning: Could not determine disembarking time for last segment")
            return None
            
        return (end_time - start_time).total_seconds() // 60
    
    @staticmethod
    def filter_segments_with_known_stops(segments, session):
        filtered = []
        for seg in segments:
            if session.is_valid_stop_id(seg.start_stop_id) and session.is_valid_stop_id(seg.end_stop_id):
                filtered.append(seg)
            else:
                print(f"Skipping segment with unknown stop id: {seg.start_stop_id} -> {seg.end_stop_id}")
        return filtered



def get_all_trips_today() -> list[MtaTrip]:
    """
    Returns a list of MtaTrip and RealtimeMtaTrip objects.
    Pulls from MTA's realtime data feed. 
    Trips that are found in the realtime feed are RealtimeMtaTrip objects.
    """
    session = Session()
    trips_by_id = {}
    # First, get all scheduled trips for today's service type
    service_type = get_todays_service_type()
    response = session.supabase.table('trips_scheduled')\
        .select('route_id,nyct_trip_id,shape_id,service_id')\
        .eq('service_id', service_type.value)\
        .execute()
    if hasattr(response, 'error') and response.error:
        print(f"Error fetching scheduled trips: {response.error}")
    else:
        for trip in response.data:
            if trip['service_id'] == get_todays_service_type().value:
                trips_by_id[trip['nyct_trip_id']] = MtaTrip(
                    route_id=session.get_route_id(trip['route_id']),
                    trip_id=trip['nyct_trip_id'],
                    shape_id=session.get_shape_id(trip['shape_id']),
                    service_type=ServiceType(trip['service_id'])
                )
    # Override with realtime trips
    for char in ONE_OF_EACH_SUBWAY_API:
        feed = nyct.NYCTFeed(char)
        for trip in feed.trips:
            trips_by_id[trip.trip_id] = RealtimeMtaTrip(trip)
    return list(trips_by_id.values())
