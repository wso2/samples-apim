![Minion](https://user-images.githubusercontent.com/3424539/171904254-ded038b7-cce8-4f38-9ac8-4d9b80a4a469.png)

### Resources

| Verb      | Method | Description
| ----------- | ----------- | ------------------ |
| trains      | GET       | Get information about the trains available |
| platforms   | GET        | Platform related information |


### Multiple SDK samples

Download SDKs to bootstrap development


## Javascript SDK example usage

```js
import React from 'react';
import axios from 'axios';

export default class PersonAdd extends React.Component {
  state = {
    name: ''
  }

  handleChange = event => {
    this.setState({ name: event.target.value });
  }

  handleSubmit = event => {
    event.preventDefault();

    const user = {
      name: this.state.name
    };

    axios.post(`https://dev.gw.apim.com/information/1.0.0/trains`, { user })
      .then(res => {
        console.log(res);
        console.log(res.data);
      })
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>
            Person Name:
            <input type="text" name="name" onChange={this.handleChange} />
          </label>
          <button type="submit">Add</button>
        </form>
      </div>
    )
  }
}
```