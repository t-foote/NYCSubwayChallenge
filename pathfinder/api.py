from fastapi import FastAPI, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import uvicorn

app = FastAPI(
    title="NYC Subway Challenge Pathfinder",
    description="Microservice for calculating optimal routes between subway stops",
    version="1.0.0",
)

class Segment(BaseModel):
    start_stop_id: str
    end_stop_id: str
    route_id: str
    estimated_time: int
    stops_in_segment: List[str]

class Journey(BaseModel):
    segments: List[Segment]

class RouteResponse(BaseModel):
    journey: Journey
    total_estimated_time: int
    remaining_stops: List[str]

@app.get("/calculate-route", response_model=RouteResponse)
async def calculate_route(
    visited_stops: str,
    current_stop: str,
):
    """
    Calculate the optimal route to visit all remaining stops.
    
    Args:
        visited_stops: Comma-separated list of stop IDs that have been visited
        current_stop: The stop ID where the user currently is
    
    Returns:
        RouteResponse: The calculated route with segments and timing information
    """
    try:
        # Parse visited stops from comma-separated string
        visited_stops_list = [stop.strip() for stop in visited_stops.split(",")]
        
        # TODO: Implement pathfinding algorithm
        # For now, just echo back the input in the expected format
        mock_segment = Segment(
            start_stop_id=current_stop,
            end_stop_id="456B",  # Example stop
            route_id="A",        # Example route
            estimated_time=300,   # Example time in seconds
            stops_in_segment=["123A", "124B", "125C", "456B"]  # Example stops
        )
        
        mock_journey = Journey(segments=[mock_segment])
        
        return RouteResponse(
            journey=mock_journey,
            total_estimated_time=1800,  # Example total time
            remaining_stops=["456B", "789C", "101D"]  # Example remaining stops
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
