from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from utils import MtaTrip, Transfer
from algo import get_optimal_journey
import uvicorn

app = FastAPI(
    title="NYC Subway Challenge Pathfinder",
    description="Microservice for calculating optimal routes between subway stops",
    version="1.0.0",
)

class MtaTripModel(BaseModel):
    route_id: str
    trip_id: str
    shape_id: str
    service_type: str

class SegmentModel(BaseModel):
    start_stop_id: str
    end_stop_id: str
    start_stop_name: str
    end_stop_name: str
    mta_trip: MtaTripModel
    all_stops_visited: List[str]
    all_stops_visited_names: List[str]

class JourneyModel(BaseModel):
    segments: List[SegmentModel]

class RouteResponse(BaseModel):
    """Response model for the /calculate-route endpoint."""
    segments: list[SegmentModel]
    total_travel_time: Optional[int] = None  # Make this optional with a default of None

@app.get("/calculate-route", response_model=RouteResponse)
async def calculate_route(
    stop_ids_already_visited: Optional[str] = None
):
    """
    Calculate the optimal journey to complete the NYC Subway Challenge.
    
    Args:
        stop_ids_already_visited: Comma-separated list of stop IDs that have been visited
    
    Returns:
        RouteResponse: The calculated journey with segments and timing information
    """
    try:
        # Convert comma-separated string to list if provided
        visited_stops = stop_ids_already_visited.split(',') if stop_ids_already_visited else []
        print(f"Calculating route with visited stops: {visited_stops}")
        
        # Get the optimal journey
        journey = get_optimal_journey(visited_stops)
        if not journey.segments:
            raise ValueError("No segments found in journey")
            
        print(f"Generated journey with {len(journey.segments)} segments")
        
        # Convert journey to response model
        segments = [
            SegmentModel(
                start_stop_id=segment.start_stop_id,
                end_stop_id=segment.end_stop_id,
                start_stop_name=segment.start_stop_name,
                end_stop_name=segment.end_stop_name,
                mta_trip=MtaTripModel(
                    route_id=segment.mta_trip.route_id,
                    trip_id=segment.mta_trip.trip_id,
                    shape_id=segment.mta_trip.shape_id,
                    service_type=str(segment.mta_trip._service_type)
                ),
                all_stops_visited=segment.all_stops_visited,
                all_stops_visited_names=segment.all_stops_visited_names
            )
            for segment in journey.segments
        ]
        
        # Calculate total travel time
        total_time = journey.get_total_travel_time()
        if total_time is None:
            raise ValueError("Could not calculate total travel time")
            
        response = RouteResponse(
            segments=segments,
            total_travel_time=total_time
        )
        print(f"Returning response: {response.model_dump_json()}")
        return response
        
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error calculating route: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=True)
