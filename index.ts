enum HTTP_METHOD {
  GET = 'GET',
  POST = 'POST',
}

enum HTTP_CODE {
  STATUS_OK = 200,
  STATUS_INTERNAL_SERVER_ERROR = 500
}

type StatusOk = {
  status: HTTP_CODE.STATUS_OK
}

type StatusError = {
  status: HTTP_CODE.STATUS_INTERNAL_SERVER_ERROR
}

type NextFunction = (request: Function | IRequest) => StatusOk | void
type ErrorFunction = (error: never) => StatusError | void

type Subscribe = (observer: IHandler) => () => void

interface IHandler {
  next: NextFunction,
  error: ErrorFunction,
  complete: () => void
}

interface IUser {
  name: string,
  age: number,
  roles: string[],
  createdAt: Date,
  isDeleated: boolean
}

interface IRequest {
  method: HTTP_METHOD,
  host: string,
  path: string,
  body?: IUser,
  params: object,
  
}

interface IObserver {
  handlers: IHandler,
  isUnsubscribed: boolean
}

class Observer implements IObserver {
  
  constructor(
    public handlers: IHandler,
    public isUnsubscribed: boolean = false,
    public _unsubscribe: () => void = () => {}
    ) {}

  next(value: Function | IRequest) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: never) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {

  constructor(public _subscribe: Subscribe) {}

  static from(values: IRequest[]) {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: IHandler) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return ({
      unsubscribe() {
        observer.unsubscribe();
      }
    });
  }
}

const userMock: IUser = {
  name: 'User Name',
  age: 26,
  roles: [
    'user',
    'admin'
  ],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: IRequest[] = [
  {
    method: HTTP_METHOD.POST,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTP_METHOD.GET,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s'
    },
  }
];

const handleRequest: NextFunction = (request) => {
  // handling of request
  return {status: HTTP_CODE.STATUS_OK};
};
const handleError: ErrorFunction = (error) => {
  // handling of error
  return {status: HTTP_CODE.STATUS_INTERNAL_SERVER_ERROR};
};

const handleComplete = () => console.log('complete');

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete
});

subscription.unsubscribe();