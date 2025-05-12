import csv
import os

STATIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'mta-static')
OUT_DIR = os.path.join(os.path.dirname(__file__), 'csv_out')
os.makedirs(OUT_DIR, exist_ok=True)

def read_csv(filename):
    with open(os.path.join(STATIC_DIR, filename), newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

# 1. Stops
stops_rows = read_csv('stops.txt')
stops = []
stop_id_map = {}
stop_pk = 1
for row in stops_rows:
    if row.get('location_type', '1') == '1':
        stops.append([stop_pk, row['stop_id'], row['stop_name'], row['stop_lat'], row['stop_lon']])
        stop_id_map[row['stop_id']] = stop_pk
        stop_pk += 1

# 2. Routes
routes_rows = read_csv('routes.txt')
routes = []
route_id_map = {}
route_pk = 1
for row in routes_rows:
    if row.get('route_type', '1') == '1':
        routes.append([route_pk, row['route_id'], row['route_long_name']])
        route_id_map[row['route_id']] = route_pk
        route_pk += 1

# 3. Shapes
shapes_rows = read_csv('shapes.txt')
shapes = []
shape_id_map = {}
shape_pk = 1
for row in shapes_rows:
    sid = row['shape_id']
    if sid not in shape_id_map:
        shapes.append([shape_pk, sid])
        shape_id_map[sid] = shape_pk
        shape_pk += 1

# 3b. Shape Points
shape_points = []
for row in shapes_rows:
    sid = row['shape_id']
    if sid in shape_id_map:
        shape_points.append([
            int(row['shape_pt_sequence']),
            shape_id_map[sid],
            row['shape_pt_lat'],
            row['shape_pt_lon']
        ])

# 4. Trips
trips_rows = read_csv('trips.txt')
trips = []
trip_id_map = {}
trip_pk = 1
for row in trips_rows:
    route_fk = route_id_map.get(row['route_id'])
    shape_fk = shape_id_map.get(row['shape_id'])
    if not route_fk or not shape_fk:
        continue
    service = row['service_id'].lower()
    if 'weekday' in service:
        service_id = 0
    elif 'saturday' in service:
        service_id = 1
    elif 'sunday' in service:
        service_id = 2
    else:
        service_id = 0
    trips.append([trip_pk, row['trip_id'], service_id, route_fk, shape_fk])
    trip_id_map[row['trip_id']] = trip_pk
    trip_pk += 1

# 5. Trip Stop Times
stop_times_rows = read_csv('stop_times.txt')
trip_stop_times = []
for row in stop_times_rows:
    # print(row)
    trip_fk = trip_id_map.get(row['trip_id'])
    stop_fk = stop_id_map.get(row['stop_id'][:3])
    if not trip_fk or not stop_fk:
        continue
    # print(2)
    def parse_time(t):
        if not t or t == '':
            return '00:00:00', False
        h, m, s = map(int, t.split(':'))
        is_next_day = False
        if h >= 24:
            h -= 24
            is_next_day = True
        return f'{h:02}:{m:02}:{s:02}', is_next_day
    arr_time, arr_next = parse_time(row['arrival_time'])
    dep_time, dep_next = parse_time(row['departure_time'])
    trip_stop_times.append([
        trip_fk,
        stop_fk,
        dep_time,
        str(dep_next).lower(),
        arr_time,
        str(arr_next).lower(),
        row['stop_sequence']
    ])

# 6. Transfers
transfers_rows = read_csv('transfers.txt')
transfers = []
for row in transfers_rows:
    from_fk = stop_id_map.get(row['from_stop_id'])
    to_fk = stop_id_map.get(row['to_stop_id'])
    if not from_fk or not to_fk or from_fk == to_fk:
        continue
    for a, b in [(from_fk, to_fk), (to_fk, from_fk)]:
        min_time = int(row.get('min_transfer_time', '0') or 0)
        min_time = min_time // 60 if min_time else 0
        transfers.append([
            a,
            b,
            min_time,
            'false'
        ])

# --- Write CSVs ---
# with open(os.path.join(OUT_DIR, 'stops.csv'), 'w', newline='', encoding='utf-8') as f:
#     writer = csv.writer(f)
#     writer.writerow(['id', 'nyct_stop_id', 'stop_name', 'latitude', 'longitude'])
#     writer.writerows(stops)

# with open(os.path.join(OUT_DIR, 'routes.csv'), 'w', newline='', encoding='utf-8') as f:
#     writer = csv.writer(f)
#     writer.writerow(['id', 'route_id', 'route_name'])
#     writer.writerows(routes)

# with open(os.path.join(OUT_DIR, 'shapes.csv'), 'w', newline='', encoding='utf-8') as f:
#     writer = csv.writer(f)
#     writer.writerow(['id', 'shape_id'])
#     writer.writerows(shapes)

# with open(os.path.join(OUT_DIR, 'trips_scheduled.csv'), 'w', newline='', encoding='utf-8') as f:
#     writer = csv.writer(f)
#     writer.writerow(['id', 'nyct_trip_id', 'service_id', 'route_id', 'shape_id'])
#     writer.writerows(trips)

# with open(os.path.join(OUT_DIR, 'trip_stop_times_scheduled.csv'), 'w', newline='', encoding='utf-8') as f:
#     writer = csv.writer(f)
#     writer.writerow(['trip_id', 'stop_id', 'dep_time', 'dep_time_is_next_day', 'arr_time', 'arr_time_is_next_day', 'sequence_number'])
#     writer.writerows(trip_stop_times)

# with open(os.path.join(OUT_DIR, 'transfers.csv'), 'w', newline='', encoding='utf-8') as f:
#     writer = csv.writer(f)
#     writer.writerow(['from_stop_id', 'to_stop_id', 'transfer_time_min', 'is_walking_transfer'])
#     writer.writerows(transfers)

with open(os.path.join(OUT_DIR, 'shape_points.csv'), 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['shape_pt_sequence', 'shape_id', 'latitude', 'longitude'])
    writer.writerows(shape_points)

print(f"CSV files written to {OUT_DIR}")