require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test '#full_name' do
    user = User.new('Bob', 'Bobson')
    assert_equal 'Bob Bobson', user.full_name
  end
end
