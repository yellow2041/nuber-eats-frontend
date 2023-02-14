import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { Button } from "../../components/button";
import { FormError } from "../../components/form-error";
import {
  createRestaurant,
  createRestaurantVariables,
} from "../../__generated__/createRestaurant";
import { MY_RESTAURANTS_QUERY } from "./my-restaurants";

const CREATE_RESTAURANT_MUTATION = gql`
  mutation createRestaurant($input: CreateRestaurantInput!) {
    createRestaurant(input: $input) {
      error
      ok
      restaurantId
    }
  }
`;

interface IFormProps {
  name: string;
  address: string;
  categoryName: string;
  file: FileList;
}

export const AddRestaurant = () => {
  const [uploading, setUploading] = useState(false);
  const client = useApolloClient();
  const history = useHistory();
  const [imageUrl, setImageUrl] = useState("");
  const onCompleted = (data: createRestaurant) => {
    const {
      createRestaurant: { ok, restaurantId },
    } = data;
    if (ok) {
      const { file, name, categoryName, address } = getValues();
      setUploading(false);
      const queryResult = client.readQuery({
        query: MY_RESTAURANTS_QUERY,
      });
      client.writeQuery({
        query: MY_RESTAURANTS_QUERY,
        data: {
          ...queryResult.myRestaurants,
          myRestaurants: [
            {
              address,
              category: {
                name: categoryName,
                __typename: "Category",
                __proto__: Object,
              },
              coverImg: imageUrl,
              id: restaurantId,
              isPromoted: false,
              name,
              __typename: "Restaurant",
            },
            ...queryResult.myRestaurants.restaurants,
          ],
        },
      });
      history.push("/");
    }
  };
  const [createRestaurantMutation, { data }] = useMutation<
    createRestaurant,
    createRestaurantVariables
  >(CREATE_RESTAURANT_MUTATION, {
    onCompleted,
  });
  const { register, getValues, formState, handleSubmit } = useForm<IFormProps>({
    mode: "onChange",
  });

  const onSubmit = async () => {
    try {
      setUploading(true);
      const { file, name, categoryName, address } = getValues();
      const actualFile = file[0];
      const formBody = new FormData();
      formBody.append("file", actualFile);
      const { url: coverImg } = await (
        await fetch("http://localhost:3030/uploads/", {
          method: "POST",
          body: formBody,
        })
      ).json();
      setImageUrl(coverImg);
      createRestaurantMutation({
        variables: {
          input: {
            name,
            categoryName,
            address,
            coverImg,
          },
        },
      });
      setUploading(false);
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <div className="container flex flex-col items-center mt-52">
      <Helmet>
        <title>Add Restaurant | Nuber Eats</title>
      </Helmet>
      <h4 className="font-semibold text-2xl mb-3">Add Restaurant</h4>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid max-w-screen-sm gap-3 mt-5 w-full mb-5"
      >
        <input
          className="input"
          type="text"
          {...register("name", { required: "Name is required." })}
          placeholder="Name"
        />
        <input
          className="input"
          type="text"
          {...register("address", { required: "Address is required." })}
          placeholder="Address"
        />
        <input
          className="input"
          type="text"
          {...register("categoryName", { required: "Category is required." })}
          placeholder="Category Name"
        />
        <div>
          <input
            type="file"
            accept="image/*"
            {...register("file", { required: true })}
          />
        </div>
        <Button
          loading={uploading}
          canClick={formState.isValid}
          actionText="Create Restaurant"
        />
        {data?.createRestaurant?.error && (
          <FormError errorMessage={data.createRestaurant.error} />
        )}
      </form>
    </div>
  );
};
