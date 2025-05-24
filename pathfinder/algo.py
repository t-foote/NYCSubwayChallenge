from utils import (
    get_all_trips_today,
    RealtimeMtaTrip,
    MtaTrip,
    ServiceType,
    Session,
    Journey,
    Segment,
    Transfer,
    format_station_id,
)

"""
This will eventually contain the actual pathfinding logic.
For now, it just returns a dummy journey.
"""

def get_optimal_journey(stop_ids_already_visited: list[str] = None) -> Journey:
    """
    Get the optimal journey to complete the NYC Subway Challenge in the least amount of time,
    given that the user has already visited some stops.
    NOTE: Currently a dummy implementation.
    """
    if stop_ids_already_visited is None:
        stop_ids_already_visited = []
        
    # Create journey with segments
    journey = Journey()
    
    # First segment: Take the 1 train from 101 to 112
    first_trip = MtaTrip(
        route_id='1',
        trip_id='AFA24GEN-1038-Sunday-00_000600_1..S03R',
        shape_id='AFA24GEN-1038-Sunday-00',
        service_type=ServiceType.Sunday
    )
    first_segment = Segment(
        start_stop_id='101',  # Van Cortlandt Park-242 St
        end_stop_id='112',    # 168 St-Washington Hts
        mta_trip=first_trip
    )
    journey.add_segment(first_segment)
    
    # Second segment: Take the 1 train from 112 to 125
    second_trip = MtaTrip(
        route_id='1',
        trip_id='AFA24GEN-1038-Sunday-00_002600_1..S03R',
        shape_id='AFA24GEN-1038-Sunday-00',
        service_type=ServiceType.Sunday
    )
    second_segment = Segment(
        start_stop_id='112',  # 168 St-Washington Hts
        end_stop_id='125',    # 59 St-Columbus Circle
        mta_trip=second_trip
    )
    journey.add_segment(second_segment)
    
    # Filter out any segments with unknown stops
    session = Session()
    filtered_segments = Journey.filter_segments_with_known_stops(journey.segments, session)
    if not filtered_segments:
        raise ValueError("No valid segments found after filtering")
    
    # Create a new journey with the filtered segments
    filtered_journey = Journey()
    for segment in filtered_segments:
        filtered_journey.add_segment(segment)
    
    return filtered_journey