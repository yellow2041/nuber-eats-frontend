# 19. Restaurants
## Trouble shooting
N/A
## 내용 정리
### Pagination 구현 방식
- 현재 page 정보를 state로 갖고 사용자가 페이지 이동 화살표를 클릭할 때마다 변경
  - page 상태가 바뀌면 해당 페이지의 내용들을 api로 다시 호출(같은 페이지 재 호출시 cache의 값 가져옴. network 탭을 확인해보면 graphql 쿼리를 다시 호출하지 않는다.) [참고](https://www.apollographql.com/docs/react/data/queries/)
  > Whenever Apollo Client fetches query results from your server, it automatically caches those results locally. This makes later executions of that same query extremely fast.
  ```javascript
  const [page, setPage] = useState(1);
  const { data, loading } = useQuery<
    restaurantsPageQuery,
    restaurantsPageQueryVariables
  >(RESTAURANTS_QUERY, {
    variables: {
      input: {
        page: page,
      },
    },
  });
  const onNextPageClick = () => setPage((current) => current + 1);
  const onPrevPageClick = () => setPage((current) => current - 1);
  ```
- page가 1이 아닌 경우에만 뒤로가기 버튼 노출, page가 restaurants 응답의 토탈 페이지(끝)이 아닐때만 다음 버튼 노출.
  ```javascript
  <div className="grid grid-cols-3 text-center max-w-md items-center mx-auto mt-10">
    {page > 1 ? (
      <button
      onClick={onPrevPageClick}
      className="focus:outline-none font-medium text-2xl"
      >
        &larr;
      </button>
    ) : (
      <div></div>
    )}
    <span>
      {page} of {data?.restaurants.totalPages}
    </span>
      {page !== data?.restaurants.totalPages && (
      <button
        onClick={onNextPageClick}
        className="focus:outline-none font-medium text-2xl"
      >
        &rarr;
      </button>
    )}
  </div>
  ```
### 조금 더 나은?코드를 위한 Restaurant 컴포넌트 분리
- 참고하기.
  > 평소 워낙 코드가 더러운편,,,으로 좋은 코드 기록용입니다.🤦‍♀️🫣
- components/restaurant.tsx
  ```javascript
  import React from "react";

  interface IRestaurantProps {
    coverImg: string | null;
    name: string;
    categoryName?: string;
    id: string;
  }

  export const Restaurant: React.FC<IRestaurantProps> = ({
    coverImg,
    name,
    categoryName,
  }) => (
    <div className="flex flex-col">
      <div
        style={{
          backgroundImage: `url(${coverImg})`,
        }}
        className="bg-cover bg-center mb-3 py-28"
      ></div>
      <h3 className="text-xlg font-medium">{name}</h3>
      <span className="border-t mt-2 py-2 text-xs opacity-50 border-gray-300">
        {categoryName}
      </span>
    </div>
  );
  ```
- pages/client/restaurants.tsx의 `Restaurant` 컴포넌트 사용부분
  ```javascript
  <div className="grid mt-16 grid-cols-3 gap-x-5 gap-y-10">
    {data?.restaurants.results?.map((restaurant) => (
      <Restaurant
        id={restaurant.id + ""}
        coverImg={restaurant.coverImg}
        name={restaurant.name}
        categoryName={restaurant.category?.name}
      />
    ))}
  </div>
  ```
### search에 react-router-dom(v5) 적용
- `useHistory()`활용
- `search`로 검색어를 push하면 path 뒤에 붙음.(URL query string)
- `state`로 전달하면 브라우저의 메모리(stack)에 저장되어 뒤로가기 누를 때 해당페이지의 state를 기억하지만 검색 결과 페이지를 url로 공유하는 경우 검색어가 전달되지 않아 여기선 `search`를 쓴다.
  ```javascript
  const { register, handleSubmit, getValues } = useForm<IFormProps>();
  const history = useHistory();
  const onSearchSubmit = () => {
    const { searchTerm } = getValues();
    history.push({
      pathname: "/search",
      search: `?term=${searchTerm}`,
    });
  };
  ```
  ```javascript
  <form
    onSubmit={handleSubmit(onSearchSubmit)}
    className="bg-gray-800 w-full py-40 flex items-center justify-center"
  >
  ```
- query가 없는 경우 /로 replace
  - push의 경우 뒤로가기를 누르면 현재 페이지(`/search`)로 돌아오지만 replace의 경우 현재로 돌아오지 않고 네비게이션에 저장된 가장 최근 페이지로 돌아간다.(`\search`를 들어오기 전의 페이지)
  ```javascript
  const [_, query] = location.search.split("?term=");
  if (!query) {
    return history.replace("/");
  }
  ```
### Lazy Query
- url의 query를 얻어오는 것이 늦어졌을 때 `useQuery()`는 쿼리를 바로 실행하지만, `useLazyQuery()`를 사용하면 query function을 반환받아 쿼리가 준비 된 이후에 실행할 수 있다.
  ```javascript
  const [queryReadyToStart, { loading, data, called }] = useLazyQuery<
    searchRestaurant,
    searchRestaurantVariables
  >(SEARCH_RESTAURANT);
  useEffect(() => {
    const [_, query] = location.search.split("?term=");
    if (!query) {
      return history.replace("/");
    }
    queryReadyToStart({
      variables: {
        input: {
          page: 1,
          query,
        },
      },
    });
  }, [history, location]);
  ```
### Apollo fragment
- gql 쿼리의 중복되는 부분은 fragment로 분리하여 사용하면 편리하다.
- src/fragments.ts
  ```javascript
  export const RESTAURANT_FRAGMENT = gql`
    fragment RestaurantParts on Restaurant {
      id
      name
      coverImg
      category {
        name
      }
      address
      isPromoted
    }
  `;
  ```
- 사용(src/pages/client/restaurants.tsx)
  ```javascript
  const RESTAURANTS_QUERY = gql`
    query restaurantsPageQuery($input: RestaurantsInput!) {
      allCategories {
        ok
        error
        categories {
          ...CategoryParts
        }
      }
      restaurants(input: $input) {
        ok
        error
        totalPages
        totalResults
        results {
          ...RestaurantParts
        }
      }
    }
    ${RESTAURANT_FRAGMENT}
    ${CATEGORY_FRAGMENT}
  `;
  ```
### useParam
- path parameter를 얻어오기 위해 사용.
- 라우터에 아래와 같이 추가(slug를 키로 parameter를 얻어올 수 있다.)
  ```javascript
  <Route key={5} path="/category/:slug" exact>
    <Category />
  </Route>
  ```
- useLocation을 사용하여 search의 값으로 url의 path param을 읽어와도 되는데 useParam이 더 간편하여 사용하였다.
```javascript
const params = useParams<ICategoryParams>();
const { data, loading } = useQuery<category, categoryVariables>(
    CATEGORY_QUERY,
    {
      variables: {
        input: {
          page: 1,
          slug: params.slug,
        },
      },
    }
  );
```
- `useLocation()` 사용시 location의 pathname을 활용하여야 한다.
  - useLocation()
    ```javascript
    {pathname: '/category/fooood', search: '', hash: '', state: undefined, key: 'r0lr2u'}
    ```
  - useParam()
    ```javascript
    {slug: 'fooood'}
    ```
# 20. Testing react components
## Trouble shooting
### LoggedInRouter테스트 실패
> 강의 촬영시와 버전이 많이 달라져서 생긴 에러로 추정
- `isLoggedInVar(true);`로 로그인여부가 업데이트 되기 전에 테스트가 수행되어 로그인된 결과가 아니라 로그아웃된 결과가 나타났다.
- 기존 코드
  ```javascript
  it("renders LoggedInRouter", async () => {
    render(<App />);
    await waitFor(() => {
      isLoggedInVar(true);
    });
    screen.getByText("logged in");
  });
  ```
- `waitFor()` 안에서 테스트까지 수행하도록 변경.
- 변경 코드
  ```javascript
  it("renders LoggedInRouter", async () => {
    render(<App />);
    await waitFor(() => {
      isLoggedInVar(true);
      expect(screen.getByText("logged in")).toBeInTheDocument();
    });
  });
  ```
## 내용정리
### React Testing Library
- Jest를 사용하여 React 컴포넌트 Mock
  ```javascript
  jest.mock("../../routers/logged-out-router", () => {
    return {
      LoggedOutRouter: () => <span>logged out</span>,
    };
  });
  ```
- Test 실행
  - `render()`는 DOM 컴포넌트를 렌더링 해주는 역할
  ```javascript
  describe("<App />", () => {
    it("renders LoggedOutRouter", () => {
      render(<App />);
      screen.getByText("logged out");
    });
  });
  ```
- rerender하여 다른 테스트 결과를 확인하는 것도 가능하다.
  ```javascript
  it("should render OK with props", () => {
    const { rerender } = render(
      <Button canClick={true} loading={false} actionText={"test"} />
    );
    screen.getByText("test");
    rerender(<Button canClick={true} loading={true} actionText={"test"} />);
    screen.getByText("Loading...");
  });
  ```
- 컨테이너를 활용해 컴포넌트의 클래스를 테스트할 수 있다.
  ```javascript
  it("should display loading", () => {
    const {
      container: { firstChild },
    } = render(<Button canClick={false} loading={true} actionText={"test"} />);
    screen.getByText("Loading...");
    expect(firstChild).toHaveClass("pointer-events-none");
  });
  ```
### Apollo client를 사용하는 컴포넌트에 대한 테스트
- `MockedProvider`를 사용
  - 개별 쿼리에 대한 mock response 를 정의할 수 있어 GraphQL 서버와 통신할 필요가 사라져 외부 종속성이 제거된다.(안정적인 테스트 가능)
  ```javascript
  it("renders verify banner", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: ME_QUERY,
            },
            result: {
              data: {
                me: {
                  id: 1,
                  email: "",
                  role: "",
                  verified: false,
                },
              },
            },
          },
        ]}
      >
        <Router>
          <Header />
        </Router>
      </MockedProvider>
    );
    await waitFor(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      screen.getByText("Please verify your email.");
    });
  });
  ```
- `getByText()` vs `queryByText()`
  - `getByText()`는 테스팅 시점에 해당 text가 렌더링되었는지 확인(해당 element가 사라졌는지는 확인 불가)
    ```javascript
    await waitFor(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      screen.getByText("Please verify your email.");
    });
    ```
  - `queryByText()`는 해당 Element가 없으면 null을 반환해줘서 `.toBeNull()`을 활용하여 해당 요소가 사라졌는지 확인할 수 있다.
    ```javascript
     await waitFor(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(screen.queryByText("Please verify your email.")).toBeNull();
    });
    ```