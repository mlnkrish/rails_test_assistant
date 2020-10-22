require 'rails_helper'

RSpec.describe User, type: :model do
  describe '#full_name' do
    it 'combines the first and last name' do
      user = User.new('Bob', 'Bobson')
      expect(user.full_name).to eq('Bob Bobson')
    end
  end
end
