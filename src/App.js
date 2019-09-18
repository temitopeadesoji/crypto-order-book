import React, { Component } from "react";
import { ReactComponent as QualitiesIllustration } from "./imgs/qualitiesIllustration.svg";
import { ReactComponent as Spinner } from "./imgs/spinner.svg";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import "./App.css";

const client = new W3CWebSocket("wss://ws.bitstamp.net");

class App extends Component {
  state = {
    currencies: [],
    bids: [],
    asks: [],
    isScrolled: false,
    pageLoaded: false,
    timestamp: 0,
    menu: "bids",
    currency: "",
    height: 0,
    width: 0,
    mid: 0,
    sprite: []
  };

  componentWillMount() {
    client.onopen = () => {
      console.log("WebSocket Client Connected");
    };
    client.onmessage = message => {
      var data = JSON.parse(message.data);
      if (
        data.channel === "order_book_" + this.state.currency &&
        data.data &&
        data.data.bids !== undefined &&
        data.data.asks !== undefined &&
        data.data.timestamp !== undefined
      ) {
        // let payload = data.data.asks;
        this.setState({
          pageLoaded: "loaded",
          bids: data.data.bids,
          asks: data.data.asks,
          timestamp: data.data.timestamp
        });
        // this.setState({ bids: data.data.bids, asks: payload, timestamp: data.data.timestamp });
        // console.log(this.state.asks);
        // console.log();
      }
    };
    window.addEventListener("scroll", this.handleScroll);
    this.fetchCurrency();
  }
  formatAMPM = date => {
    // This is to display 12 hour format like you asked
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  };
  formatDate = payload => {
    payload = new Date(Number(payload) * 1000);
    payload =
      payload.getMonth() +
      "/" +
      payload.getDate() +
      "/" +
      payload.getFullYear() +
      " " +
      this.formatAMPM(payload);
    return payload;
  };
  handleScroll = () => {
    if (window.pageYOffset > 100) {
      this.setState({ isScrolled: true });
    } else {
      this.setState({ isScrolled: false });
    }
  };
  handleMenu = payload => {
    this.setState({ menu: payload });
  };
  fetchCurrency = () => {
    fetch("https://www.bitstamp.net/api/v2/trading-pairs-info/")
      .then(res => res.json())
      .then(data => {
        this.setState({ currencies: data });
      })
      .catch(console.log);
  };
  selectCurrency = event => {
    event = event.target.value.replace(/\//g, "").toLowerCase();
    if (this.state.currency && this.state.currency !== event) {
      this.setState({
        pageLoaded: "loading"
      });
      this.unSubscribe(event);
    } else {
      this.setState({
        pageLoaded: "loading",
        currency: event
      });
      this.subscribe(event);
    }
  };
  subscribe = event => {
    const message = {
      event: "bts:subscribe",
      data: {
        channel: "order_book_" + event
      }
    };
    client.send(JSON.stringify(message));
  };
  unSubscribe = event => {
    const message = {
      event: "bts:unsubscribe",
      data: {
        channel: "order_book_" + this.state.currency
      }
    };
    client.send(JSON.stringify(message));
    this.setState(
      {
        currency: event
      },
      () => {
        this.subscribe(event);
      }
    );
  };
  render() {
    const currenciesView = this.state.currencies.map((val, index) => {
      return <option key={val.name}>{val.name}</option>;
    });
    let streamingOrders, streamingMenu, streamingDate;

    if (this.state.pageLoaded === false) {
      streamingOrders = (
        <div>
          <p>No subscription available</p>
        </div>
      );
      streamingMenu = "";
    } else if (this.state.pageLoaded === "loaded") {
      streamingDate = (
        <div className="streamingDate">
          {this.formatDate(this.state.timestamp)}
        </div>
      );
      streamingOrders = this.state[this.state.menu].map(val => {
        return <div key={val}>{val}</div>;
      });
      streamingMenu = (
        <div className="sideBar">
          <div
            onClick={() => this.handleMenu("bids")}
            className={this.state.menu === "bids" ? "active" : ""}
          >
            Bids
          </div>
          <div
            onClick={() => this.handleMenu("asks")}
            className={this.state.menu === "asks" ? "active" : ""}
          >
            Asks
          </div>
        </div>
      );
    } else {
      streamingOrders = (
        <div>
          <p>Loading</p>
          <Spinner />
        </div>
      );
    }

    return (
      <div className="app" onScroll={this.handleScroll}>
        <header className={this.state.isScrolled ? "fixed" : "show"}>
          <h1>Crypto order book app</h1>
          <p>A coding challenge by busha</p>
          <select
            className="select"
            defaultValue={0}
            onChange={this.selectCurrency}
          >
            <option value="0" disabled>
              Choose a currency pair
            </option>
            {currenciesView}
          </select>
          {streamingMenu}
          {streamingDate}
        </header>
        <QualitiesIllustration className="fancy" />
        <div className="streamingOrders">{streamingOrders}</div>
        <div className="footer">
          <p>Built By ADESOJI TEMITOPE</p>
        </div>
      </div>
    );
  }
}

export default App;
