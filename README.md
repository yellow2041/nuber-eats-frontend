# 17. Authentication
## Trouble shooting
### graphQL과 Apollo의 버전이 맞지 않는 문제
```
 Generating query files with 'typescript' target
    → spurious results.
    Error: Cannot use GraphQLScalarType "String" from another module or realm.

    Ensure that there is only one instance of "graphql" in the node_modules
    directory. If different versions of "graphql" are the dependencies of other
    relied on modules, use "resolutions" to ensure only one version is installed.

    https://yarnpkg.com/en/docs/selective-version-resolutions

    Duplicate "graphql" modules cannot be used at the same time since different
    versions may have different capabilities and behavior. The data from one
    version used in the function from another could produce confusing and
    spurious results.
```
- `npm run apollo:codegen` 명령어 실행 시 위와 같은 에러 발생
  - apollographql의 버전과 graphql의 버전을 맞춰주면 된다.(아직 apollographql의 일부 패키지들이 업데이트가 되지 않아 graphql의 최신버전과 맞지 않는듯 함)
  - graphQL의 버전을 15.8.3으로 낮추고, 문제의 패키지 버전을 graphql의 버전과 강제로 맞추도록 함.
  - package.json에 글큐 버전 변경하여 `npm install` 후 `npm uninstall apollo`로 기존 패키지 삭제.
  - package.json에 아래 내용 추가
    ```json
    "overrides": {
      "@apollo/client": {
        "react": "$react"
      },
      "@apollographql/graphql-language-service-interface": {
        "graphql": "$graphql"
      },
      "@apollographql/graphql-language-service-parser": {
        "graphql": "$graphql"
      },
      "@apollographql/graphql-language-service-types": {
        "graphql": "$graphql"
      },
      "@apollographql/graphql-language-service-utils": {
        "graphql": "$graphql"
      }
    },
    ```
  - `npm install apollo`로 아폴로 재설치
### CORS 문제
```
Access to fetch at 'http://localhost:3030/' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```
위와 같이 CORS 문제가 발생하여 백엔드의 main.ts에 `app.enableCors();`로 cors 설정을 추가하였다.
## 내용 정리
### codegen을 이용한 DTO 자동 생성
```javascript
const LOGIN_MUTATION = gql`
  mutation loginMutation($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      ok
      token
      error
    }
  }
`;
```
위와 같이 mutation을 만들고 codegen을 실행하면 
> codegen 은 `apollo client:codegen src/__generated__ --target=typescript --outputFlat`로 실행한다.(package.json에 scripts로 등록)
```javascript
export interface loginMutation_login {
  __typename: "LoginOutput";
  ok: boolean;
  token: string | null;
  error: string | null;
}

export interface loginMutation {
  login: loginMutation_login;
}

export interface loginMutationVariables {
  email: string;
  password: string;
}
```
이렇게 DTO를 자동 생성해준다.
👉🏻 개발시 위 타입을 사용하여 자동으로 Type에 보호받을 수 있다.
mutation의 Input까지 보호받기 위해서는
```javascript
const LOGIN_MUTATION = gql`
  mutation loginMutation($loginInput: LoginInput!) {
    login(input: $loginInput) {
      ok
      token
      error
    }
  }
`;
```
위와 같이 Input Type을 적고 codegen을 실행하면 백엔드 graphQL의 스키마에 따라 아래처럼 새 타입이 생긴다.
```javascript
export interface LoginInput {
  email: string;
  password: string;
}
```
따라서 `loginMutation` 실행 시 아래와 같이 변수로 LoginInput 타입을 넘겨줘야 한다.
```javascript
const [loginMutation, { data }] = useMutation<
    loginMutation,
    loginMutationVariables
  >(LOGIN_MUTATION);
const onSubmit = () => {
    const { email, password } = getValues();
    loginMutation({
      variables: {
        loginInput: {
          email,
          password,
        },
      },
    });
  };
```
이제 백엔드에서 DTO를 수정하면 프론트의 타입스크립트가 해당 타입을 지적해 줄 것임.(버그 최소화 가능)
### React Helmet
- 페이지별로 타이틀을 설정할 수 있는 라이브러리
- 설치 방법
  ```
  npm i react-helmet
  npm i --save-dev @types/react-helmet
  ```
- 페이지별로 아래와같이 추가하여 설정 가능
  ```jsx
  <Helmet>
    <title>Create Account | Nuber eats</title>
  </Helmet>
  ```
### React Helmet Async
- react-helmet이 비동기 처리에 문제가 생길 수 있음
  - thread-safe하지 않은 react-side-effect에 의존. 여러 쓰레드로부터 동시에 접근이 이루어져도 프로그램에 문제가 생기지 않음.
- `react-helmet-async` 설치 후 index.tsx에 `<HelmetProvider>` 추가하여 사용.
### 로그인 구현 방식
- 로그인 뮤테이션 호출 후 성공 여부에 따라 local storage에 토큰 저장.
- login.tsx
  ```javascript
    const onCompleted = (data: loginMutation) => {
    const {
      login: { error, ok, token },
    } = data;
    if (ok && token) {
      localStorage.setItem(LOCALSTORAGE_TOKEN, token);
      authToken(token);
      isLoggedInVar(true);
    }
  };

  const [loginMutation, { data: loginMutationResult, loading }] = useMutation<
    loginMutation,
    loginMutationVariables
  >(LOGIN_MUTATION, {
    onCompleted,
  });
  ```
- apollo.ts에서 로컬스토리지 토큰값 설정 여부를 받아와서 로그인 여부 확인.
  ```javascript
  import { ApolloClient, InMemoryCache, makeVar } from "@apollo/client";
  import { LOCALSTORAGE_TOKEN } from "./constant";

  const token = localStorage.getItem(LOCALSTORAGE_TOKEN);
  
  export const isLoggedInVar = makeVar(Boolean(token));
  export const authToken = makeVar(token);

  export const client = new ApolloClient({
    uri: "http://localhost:3030/graphql",
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            isLoggedIn: {
              read() {
                return isLoggedInVar();
              },
            },
            token: {
              read() {
                return authToken();
              },
            },
          },
        },
      },
    }),
  });
  ```
### request header 설정
- apollo client의 `createHttpLink()`와 `setContext()` 활용
> apollo link 는 클라이언트와 서버 사이의 데이터 흐름을 사용자가 정의할 수 있게 해준다.(http request header 설정 가능)
- apollo.ts
  ```javascript
  const httpLink = createHttpLink({
    uri: "http://localhost:3030/graphql",
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        "x-jwt": token || "",
      },
    };
  });

  export const client = new ApolloClient({
    link: authLink.concat(httpLink),
    ...
  });
  ```
### Router 설정(react-router-dom v5)
- path와 완전히 일치한 url로 라우팅하기 위해 `exact` 사용
- `<Switch></Switch>` 안에는 `<Route></Route>`태그만 사용가능하여 fragment로 감싸주면 에러 발생.
```javascript
import { gql, useQuery } from "@apollo/client";
import React from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import { Header } from "../components/header";
import { meQuery } from "../__generated__/meQuery";
import { Restaurants } from "./client/restaurants";

const ClientRoutes = [
  <Route path="/" exact>
    <Restaurants />
  </Route>,
];

const ME_QUERY = gql`
  query meQuery {
    me {
      id
      email
      role
      verified
    }
  }
`;

export const LoggedInRouter = () => {
  const { data, loading, error } = useQuery<meQuery>(ME_QUERY);

  if (!data || loading || error) {
    return (
      <div className="h-screen flex justify-center items-center">
        <span className="font-medium text-xl tracking-wide">Loading...</span>
      </div>
    );
  }
  return (
    <Router>
      <Header />
      <Switch>
        {data.me.role === "Client" && ClientRoutes}
        <Redirect to="/" />
      </Switch>
    </Router>
  );
};

```
### Apollo cache를 활용한 hook
```javascript
import { gql, useQuery } from "@apollo/client";
import { meQuery } from "../__generated__/meQuery";

const ME_QUERY = gql`
  query meQuery {
    me {
      id
      email
      role
      verified
    }
  }
`;
export const useMe = () => {
  return useQuery<meQuery>(ME_QUERY);
};
```
- 위와같이 여러 컴포넌트 안에서 필요한 정보는 hook으로 작성하여 사용하는 것이 편하다.
- 여러개의 컴포넌트 속에서 필요한 정보의 경우 redux와 같은 상태관리툴을 사용하는데, apollo client의 경우 위와같이 hook을 호출하여 사용하면 브라우저의 메모리에 캐시로 저장되어 실제로 graphql을 호출하지 않고 정보를 가져올 수 있다.
  > 여러 컴포넌트에서 `useMe()`를 호출하지만 실제로 Network탭에서 graphql이 호출된 것을 살펴보면 최초 1회만 호출된 것을 확인할 수 있다.
# 18. USER PAGES
## Trouble shooting

## 내용 정리
### Apollo Client 캐시 직접 수정
- 사용자의 이메일이 인증되면 client cache의 verified가 변경되어야 한다.
- 이 부분은 apollo client의 fragment를 이용하여 graphQL 쿼리를 던지지 않고 Apollo Client 의 캐시를 수정할 수 있다.
```javascript
  const onCompleted = (data: verifyEmail) => {
    const {
      verifyEmail: { ok },
    } = data;
    if (ok && userData?.me.id) {
      client.writeFragment({
        id: `User:${userData?.me.id}` + "",
        fragment: gql`
          fragment VerifiedUser on User {
            verified
          }
        `,
        data: {
          verified: true,
        },
      });
    }
  };
  const [verifyEmail, { loading: verifyingEmail }] = useMutation<
    verifyEmail,
    verifyEmailVariables
  >(VERIFT_EMAIL_MUTATION, {
    onCompleted,
  });
```
- email update시에도 똑같이 object의 id를 이용하여 캐시에 새로운 email과 verified 를 업데이트.
### refetch를 이용한 캐시 수정
- fragment를 이용한 방법은 이메일 수정이 성공하면 user 정보를 재호출하지 않고 직접 캐시를 수정하는 방법이다.
- refetch를 이용하면 수정 후 userMe쿼리의 refetch를 실행하여 새 정보를 다시 호출해오고, 캐시도 함께 업데이트 해준다. 이 경우 api를 다시 한번 더 호출하게 되지만 구현은 더 간단하다.(refetch는 promise를 반환한다.)
- 위에서 fragment를 사용하여 처리한 부분은 아래와 같이 처리할 수도 있다.
  ```javascript
  const { data: userData, refetch } = useMe();
  const onCompleted = async (data: verifyEmail) => {
    const {
      verifyEmail: { ok },
    } = data;
    if (ok && userData?.me.id) {
      await refetch();
    }
  };
  ```
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

