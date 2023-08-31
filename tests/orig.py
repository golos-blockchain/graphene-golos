import unittest
from bitshares.bitshares import BitShares
from bitshares.account import Account
from bitshares.amount import Asset
from bitshares.market import Market
import json

base = 'GBG'
quote = 'GOLOS'

acc_name = 'cyberfounder100'
# acc_name = 'init0'

node = 'ws://127.0.0.1:3001'
# node = 'ws://127.0.0.1:11011'

keys = ['5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS']
# keys = ['5KLrir6U8JbtC7u65fekaznfztJxR9zoTq3wgGmTQsr46HdMoLH']

# wallet with keys will be in InRamPlainKeyStore, not SQLite
bs = BitShares(node=node, keys=keys)

class MyTest(unittest.TestCase):
    def setUp(self):
        print('\n-- ' + self.id().split('.')[-1])

    def test1(self):
        tic = bs.rpc.get_ticker(base, quote)
        self.assertEqual(tic['base'], base)
        self.assertEqual(tic['quote'], quote)
        self.assertEqual(tic['base_volume'], '0')
        self.assertEqual(tic['quote_volume'], '0')
        self.assertEqual(tic['latest'], '0')
        self.assertEqual(tic['lowest_ask'], '0')
        self.assertEqual(tic['highest_bid'], '0')

    def test2(self):
        # acc_res = bs.rpc.get_full_accounts([acc_name])
        # self.assertEqual(acc_res[0][0], acc_name)
        # acc_obj = acc_res[0][1]
        # acc = acc_obj['account']
        golos = Asset('GOLOS', bitshares_instance=bs)
        gbg = Asset('GBG', bitshares_instance=bs)

        golos_bal = None
        gbg_bal = None
        acc = Account(acc_name, bitshares_instance=bs)
        for bal in acc.balances:
            if bal.asset.identifier == golos.identifier:
                golos_bal = bal
            if bal.asset.identifier == gbg.identifier:
                gbg_bal = bal

        self.assertNotEqual(golos_bal, None)
        self.assertNotEqual(gbg_bal, None)
        self.assertEqual(golos_bal.symbol, 'GOLOS')
        self.assertEqual(gbg_bal.symbol, 'GBG')
        self.assertEqual(gbg_bal.amount,   10000.000)
        self.assertEqual(golos_bal.amount, 100000.000)

    def test3(self):
        acc = Account(acc_name, bitshares_instance=bs)
        self.assertEqual(len(acc.openorders), 0)

        m = Market(quote + '/' + base, blockchain_instance=bs)
        # price = base / quote
        price = 10
        # sell 1000 GOLOS (quote), wants 10000 GBG
        res = m.sell(10, 1000, account=acc_name, returnOrderId=True)
        print(res)
        orderid = res['orderid']
        self.assertEqual(res['operation_results'][0][0], 1)
        self.assertEqual(res['operation_results'][0][1], orderid)
        # buys 10000 GOLOS (quote), for 1000 GBG
        res = m.buy(0.1, 10000, account=acc_name, returnOrderId=True)
        print(res)
        orderid = res['orderid']
        self.assertEqual(res['operation_results'][0][0], 1)
        self.assertEqual(res['operation_results'][0][1], orderid)

    def test4(self):
        acc = Account(acc_name, bitshares_instance=bs)
        self.assertEqual(len(acc.openorders), 2)
        order = acc.openorders[0]
        self.assertEqual(order['for_sale']['amount'], 1000)
        self.assertEqual(order['for_sale']['symbol'], 'GOLOS')

        self.assertEqual(order['base']['amount'], 1000)
        self.assertEqual(order['base']['symbol'], 'GOLOS')
        golos_id = order['base']['asset']['id']

        self.assertEqual(order['quote']['amount'], 10000)
        self.assertEqual(order['quote']['symbol'], 'GBG')
        gbg_id = order['quote']['asset']['id']

        self.assertEqual(order['sell_price']['base']['amount'], 1000000)
        self.assertEqual(order['sell_price']['base']['asset_id'], golos_id)
        self.assertEqual(order['sell_price']['quote']['amount'], 10000000)
        self.assertEqual(order['sell_price']['quote']['asset_id'], gbg_id)

        # price = base / quote
        self.assertEqual(order['price'], 1000 / 10000)

    def test5(self):
        acc = Account(acc_name, bitshares_instance=bs)
        self.assertEqual(len(acc.openorders), 2)
        order = acc.openorders[1]
        self.assertEqual(order['for_sale']['amount'], 1000)
        self.assertEqual(order['for_sale']['symbol'], 'GBG')

        self.assertEqual(order['base']['amount'], 1000)
        self.assertEqual(order['base']['symbol'], 'GBG')
        gbg_id = order['base']['asset']['id']

        self.assertEqual(order['quote']['amount'], 10000)
        self.assertEqual(order['quote']['symbol'], 'GOLOS')
        golos_id = order['quote']['asset']['id']

        self.assertEqual(order['sell_price']['base']['amount'], 1000000)
        self.assertEqual(order['sell_price']['base']['asset_id'], gbg_id)
        self.assertEqual(order['sell_price']['quote']['amount'], 10000000)
        self.assertEqual(order['sell_price']['quote']['asset_id'], golos_id)

        # price = base / quote
        self.assertEqual(order['price'], 1000 / 10000)

if __name__ == '__main__':
    unittest.main()
