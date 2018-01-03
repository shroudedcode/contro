import { expect } from 'chai'
import * as Mocha from 'mocha'
import { IGamepad, INavigator, IWindow  } from '../apis'
import { store } from '../index'
import { Vector2 } from '../utils/math'
import { MockEventTarget } from '../utils/mock'
import { Gamepad } from './gamepad'

class MockWindow extends MockEventTarget implements IWindow {}

class MockNavigator extends MockEventTarget implements INavigator {

  public gamepads: IGamepad[] = []

  public getGamepads() {
    return this.gamepads
  }

}

function mockPack() {
  const win = new MockWindow()
  const nav = new MockNavigator()
  const gamepad = new Gamepad({ win, nav })
  return { win, nav, gamepad }
}

describe('The `Gamepad` class', () => {

  it('should register the required listeners on the window', () => {
    const { win, nav, gamepad } = mockPack()

    expect(Object.keys(win.listeners).sort()).to.deep.equal([
      'gamepadconnected',
      'gamepaddisconnected',
    ].sort())
  })

  describe('should have an `isConnected()` method that', () => {
    const { win, nav, gamepad } = mockPack()

    it('returns `false` before any gamepad was connected', () => {
      expect(gamepad.isConnected()).to.equal(false)
    })

    it('returns `true` after a gamepad was connected', () => {
      nav.gamepads[0] = {
        index: 0,
        buttons: [
          {
            pressed: false,
          },
        ],
        axes: [],
        connected: true,
        timestamp: 0,
      }

      win.listeners.gamepadconnected({ gamepad: { index: 0 } })
      expect(gamepad.isConnected()).to.equal(true)
    })

    it('returns `false` after the gamepad was disconnected', () => {
      nav.gamepads.pop()
      win.listeners.gamepaddisconnected({ gamepad: { index: 0 } })
      expect(gamepad.isConnected()).to.equal(false)
    })

    it('returns `true` again after a gamepad was connected', () => {
      nav.gamepads[0] = {
        index: 0,
        buttons: [],
        axes: [],
        connected: true,
        timestamp: 0,
      }

      win.listeners.gamepadconnected({ gamepad: { index: 0 } })
      expect(gamepad.isConnected()).to.equal(true)
    })

    after(() => {
      nav.gamepads.pop()
      win.listeners.gamepaddisconnected({ gamepad: { index: 0 } })
    })

  })

  describe('in its disconnected state', () => {

    const { win, nav, gamepad } = mockPack()

    it('should set `store.preferGamepad` to `false`', () => {
      expect(store.preferGamepad).to.equal(false)
    })

    describe('should have an `button()` method that returns a component that', () => {

      it('when queried `false`', () => {
        expect(gamepad.button(0).query()).to.equal(false)
      })

      it('when initialized with `trigger = true` and queried returns `false`', () => {
        expect(gamepad.button(0, true).query()).to.equal(false)
      })

    })

  })

  describe('in its connected state', () => {

    const { win, nav, gamepad } = mockPack()

    before(() => {
      nav.gamepads[0] = {
        index: 0,
        buttons: [
          {
            pressed: false,
          },
        ],
        axes: [0, 0, 0, 0],
        connected: true,
        timestamp: 0,
      }

      win.listeners.gamepadconnected({ gamepad: { index: 0 } })
    })

    it('should set `store.preferGamepad` to `true`', () => {
      expect(store.preferGamepad).to.equal(true)
    })

    describe('should have a `button()` method that returns a component that', () => {

      it('returns `false` when the button is not pressed', () => {
        expect(gamepad.button(0).query()).to.equal(false)
      })

      it('returns `true` when the button is pressed', () => {
        nav.gamepads[0].buttons[0].pressed = true
        expect(gamepad.button(0).query()).to.equal(true)
      })

      describe('when initialized with `trigger = true`', () => {

        it('returns `false` when the key is not pressed', () => {
          nav.gamepads[0].buttons[0].pressed = false
          expect(gamepad.button(0, true).query()).to.equal(false)
        })

        it('returns `true` once after the key was pressed', () => {
          nav.gamepads[0].buttons[0].pressed = true
          expect(gamepad.button(0, true).query()).to.equal(true)
        })

        it('returns `false` after the key state was queried', () => {
          expect(gamepad.button(0, true).query()).to.equal(false)
        })

      })

    })

    describe('should have a `stick()` method that returns a component that', () => {

      it('throws an error when initialized with an invalid stick', () => {
        expect(() => gamepad.stick('lol')).to.throw(Error, 'Gamepad stick "lol" not found!')
      })

      it('returns a (0, 0) vector when initially queried', () => {
        expect(gamepad.stick('left')).to.deep.equal(new Vector2())
      })

      it('returns the correct vector when queried after change', () => {
        nav.gamepads[0].axes[0] = .56
        nav.gamepads[0].axes[1] = .31
        expect(gamepad.stick('left')).to.deep.equal(new Vector2(.56, .31))
      })

      it('also works with custom axis numbers', () => {
        nav.gamepads[0].axes[2] = .42
        nav.gamepads[0].axes[3] = .69
        expect(gamepad.stick({ xAxis: 2, yAxis: 3 })).to.deep.equal(new Vector2(.42, .69))
      })

    })

  })

})
