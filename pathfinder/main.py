from utils import (
    get_all_trips_today,
    RealtimeMtaTrip,
    MtaTrip,
    ServiceType,
    Session,
    Journey,
    Segment,
    Transfer,
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
    session = Session()
    # Get all trips running today
    trips = get_all_trips_today()
    
    # Create a dummy journey with a few segments
    # First segment: Take the A train from 125 St to 59 St
    first_trip = next(trip for trip in trips if trip.route_id == 'A')
    first_segment = Segment(
        start_stop_id='A11',  # 125 St
        end_stop_id='A24',    # 59 St
        mta_trip=first_trip
    )
    journey = Journey(first_segment)
    
    # Second segment: Transfer to the 1 train and go to Times Square
    second_trip = next(trip for trip in trips if trip.route_id == '1')
    transfer = Transfer(
        start_stop_id='A24',  # 59 St
        end_stop_id='127',    # 59 St (1 train)
        transfer_time_min=5,
        is_walking=True
    )
    second_segment = Segment(
        start_stop_id='127',  # 59 St (1 train)
        end_stop_id='127N',   # Times Square
        mta_trip=second_trip
    )
    journey.add_transfer_and_segment(transfer, second_segment)
    
    return journey