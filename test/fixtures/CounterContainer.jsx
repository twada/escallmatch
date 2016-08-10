import {Component} from 'react';
import {Container} from 'flux/utils';

type CounterStoreStateType = {counter: number};
type CounterContainerStateType = {
    qty: number,
    total: number
};

class CounterContainer extends Component {
  static getStores(): Array<Store> {
    return [CounterStore];
  }

  static calculateState(prevState: CounterStoreStateType): CounterStoreStateType {
    return {
      counter: CounterStore.getState(),
    };
  }

  static propTypes = {
    title: React.PropTypes.string.isRequired,
    price: React.PropTypes.number.isRequired,
    initialQty: React.PropTypes.number
  };

  state: CounterContainerStateType = {
    qty: this.props.initialQty,
    total: 0
  };

  render() {
    custom(<CounterUI/>).assert(0 <= this.state.counter);
    return <CounterUI counter={this.state.counter} />;
  }
}

const container: CounterContainer = Container.create(CounterContainer);
