import { useMutation, useSubscription } from "@apollo/client";
import GoogleMapReact from "google-map-react";
import { gql } from "graphql-tag";
import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { FULL_ORDER_FRAGMENT } from "../../fragments";
import { cookedOrders } from "../../__generated__/cookedOrders";
import { takeOrder, takeOrderVariables } from "../../__generated__/takeOrder";

const COOCKED_ORDERS_SUBSCRIPTION = gql`
  subscription cookedOrders {
    cookedOrders {
      ...FullOrderParts
    }
  }
  ${FULL_ORDER_FRAGMENT}
`;

const TAKE_ORDER_MUTATION = gql`
  mutation takeOrder($input: TakeOrderInput!) {
    takeOrder(input: $input) {
      ok
      error
    }
  }
`;

interface ICoords {
  lat: number;
  lng: number;
}

interface IDriverProps {
  lat: number;
  lng: number;
  $hover?: any;
}
const Driver: React.FC<IDriverProps> = () => <div className="text-2xl">🐵</div>;

export const Dashboard = () => {
  const [driverCoords, setDriverCoords] = useState<ICoords>({ lng: 0, lat: 0 });
  const [map, setMap] = useState<google.maps.Map>();
  const [maps, setMaps] = useState<any>();
  const onSuccess = ({
    coords: { latitude, longitude },
  }: GeolocationPosition) => {
    setDriverCoords({ lat: latitude, lng: longitude });
  };
  const onError = (error: GeolocationPositionError) => {
    console.log(error);
  };
  useEffect(() => {
    navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
    });
  });
  useEffect(() => {
    if (map && maps) {
      map.panTo(new google.maps.LatLng(driverCoords.lat, driverCoords.lng));
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        {
          location: new google.maps.LatLng(driverCoords.lat, driverCoords.lng),
        },
        (results, status) => {
          console.log(status, results);
        }
      );
    }
  }, [driverCoords.lat, driverCoords.lng]);
  const onApiLoaded = ({ map, maps }: { map: any; maps: any }) => {
    map.panTo(new google.maps.LatLng(driverCoords.lat, driverCoords.lng));
    setMap(map);
    setMaps(maps);
  };
  const makeRoute = () => {
    if (map) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "#9421AC",
          strokeOpacity: 1,
          strokeWeight: 5,
        },
      });
      directionsRenderer.setMap(map);
      directionsService.route(
        {
          origin: {
            location: new google.maps.LatLng(
              driverCoords.lat,
              driverCoords.lng
            ),
          },
          destination: {
            location: new google.maps.LatLng(
              driverCoords.lat + 0.05,
              driverCoords.lng + 0.05
            ),
          },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result) => {
          directionsRenderer.setDirections(result);
        }
      );
    }
  };
  const { data: cookedOrderData } = useSubscription<cookedOrders>(
    COOCKED_ORDERS_SUBSCRIPTION
  );
  useEffect(() => {
    if (cookedOrderData?.cookedOrders.id) {
      makeRoute();
    }
  }, [cookedOrderData]);
  const history = useHistory();
  const onCompleted = (data: takeOrder) => {
    if (data.takeOrder.ok) {
      history.push(`/order/${cookedOrderData?.cookedOrders.id}`);
    }
  };
  const [takeOrderMutation] = useMutation<takeOrder, takeOrderVariables>(
    TAKE_ORDER_MUTATION,
    { onCompleted }
  );
  const triggerMutation = (orderId: number) => {
    takeOrderMutation({
      variables: {
        input: {
          id: orderId,
        },
      },
    });
  };
  return (
    <>
      <div
        className="overflow-hidden"
        style={{ width: window.innerWidth, height: "50vh" }}
      >
        <GoogleMapReact
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={onApiLoaded}
          defaultZoom={16}
          draggable={false}
          defaultCenter={{ lat: 37.5185964, lng: 126.6710565 }}
          bootstrapURLKeys={{ key: "AIzaSyBh1H1ooNBvj9rAapxyKDyvuMAdtofHJdA" }}
        >
          <Driver lat={driverCoords.lat} lng={driverCoords.lng} />
        </GoogleMapReact>
      </div>
      <div>
        <div className="max-w-screen-sm mx-auto bg-white relative -top-10 shadow-lg py-8 px-5">
          {cookedOrderData?.cookedOrders.restaurant ? (
            <>
              <h1 className="text-center text-3xl font-medium">
                New Cooked Order
              </h1>
              <h4 className="text-center my-3 text-2xl font-medium">
                Pick it up soon @{" "}
                {cookedOrderData.cookedOrders.restaurant?.name}
              </h4>
              <button
                onClick={() =>
                  triggerMutation(cookedOrderData?.cookedOrders.id)
                }
                className="btn block text-center w-full mt-5"
              >
                Accept Challenge
              </button>
            </>
          ) : (
            <h1 className="text-center text-3xl font-medium">
              No Orders yet...
            </h1>
          )}
        </div>
      </div>
    </>
  );
};
