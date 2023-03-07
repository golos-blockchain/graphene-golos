import unittest
from bitshares.bitshares import BitShares
from bitshares.account import Account
from bitshares.amount import Asset

base = 'GBG'
quote = 'GOLOS'

acc_name = 'cyberfounder100'
acc_name = 'init0'

node = 'ws://127.0.0.1:3001'
node = 'ws://127.0.0.1:11011'
bs = BitShares(node=node)

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

if __name__ == '__main__':
    unittest.main()
